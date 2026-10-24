export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { settleKasPayment, getQrisConfig } from '@/lib/qris'
import { auth, hasPermission } from '@/lib/auth'

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = rawBody ? JSON.parse(rawBody) : {}
    const config = await getQrisConfig()
    const headerWebhookSecret = request.headers.get('x-webhook-secret') || ''
    const hasValidHeaderSecret =
      Boolean(config.gateway.webhookSecret) &&
      config.gateway.webhookSecret !== 'hubbhq-webhook-secret-key' &&
      safeCompare(headerWebhookSecret, config.gateway.webhookSecret)

    // 1. Identifikasi payload & verifikasi tanda tangan kriptografis berdasarkan provider
    let paymentRef = ''
    let isSettled = false
    let amount = 0

    // Format Midtrans
    if (body.order_id && body.transaction_status) {
      const expectedSig = crypto
        .createHash('sha512')
        .update(
          `${body.order_id}${body.status_code || '200'}${body.gross_amount || ''}${config.gateway.apiKey}`
        )
        .digest('hex')

      const validMidtransSig =
        Boolean(config.gateway.apiKey) &&
        typeof body.signature_key === 'string' &&
        safeCompare(body.signature_key, expectedSig)

      if (!validMidtransSig && !hasValidHeaderSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Signature webhook Midtrans tidak valid' },
          { status: 401 }
        )
      }

      paymentRef = body.order_id
      isSettled =
        body.transaction_status === 'settlement' ||
        body.transaction_status === 'capture'
      amount = parseFloat(body.gross_amount) || 0
    }
    // Format Tripay
    else if (body.merchant_ref && body.status) {
      const callbackSig = request.headers.get('x-callback-signature') || ''
      const expectedHmac = crypto
        .createHmac('sha256', config.gateway.apiKey || '')
        .update(rawBody)
        .digest('hex')

      const validTripaySig =
        Boolean(config.gateway.apiKey) &&
        Boolean(callbackSig) &&
        safeCompare(callbackSig, expectedHmac)

      if (!validTripaySig && !hasValidHeaderSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Signature callback Tripay tidak valid' },
          { status: 401 }
        )
      }

      paymentRef = body.merchant_ref
      isSettled = body.status === 'PAID'
      amount = parseFloat(body.total_amount) || 0
    }
    // Format Simulasi HubbHQ
    else if (body.action === 'SIMULATE_PAY' || body.paymentRef) {
      let authorizedSimulate = hasValidHeaderSecret

      if (!authorizedSimulate) {
        const session = await auth()
        if (session?.user?.id) {
          const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
          const isTreasurerOrAdmin =
            ['admin', 'bendahara', 'ketua'].includes(roleName) ||
            (await hasPermission(session.user.id, 'keuangan.approve')) ||
            (await hasPermission(session.user.id, 'keuangan.edit'))

          const isSimModeActive =
            config.mode === 'GATEWAY' &&
            config.gateway.provider === 'simulation' &&
            !config.gateway.isProduction

          authorizedSimulate = isTreasurerOrAdmin || isSimModeActive
        }
      }

      if (!authorizedSimulate) {
        return NextResponse.json(
          { error: 'Forbidden: Simulasi pembayaran tidak diizinkan tanpa otorisasi' },
          { status: 403 }
        )
      }

      paymentRef = body.paymentRef
      isSettled = true
      amount = parseFloat(body.amount) || 0
    }

    if (!paymentRef) {
      return NextResponse.json(
        { error: 'Referensi pembayaran (paymentRef / order_id) tidak ditemukan' },
        { status: 400 }
      )
    }

    if (!isSettled) {
      // Bukan status sukses bayar (misal pending, expired, denied)
      return NextResponse.json({
        success: true,
        message: 'Status bukan settlement, tidak ada aksi',
      })
    }

    // Eksekusi rekonsiliasi dan pembukuan kas otomatis
    const result = await settleKasPayment(
      paymentRef,
      amount,
      `Pembayaran QRIS Otomatis (Ref: ${paymentRef})`
    )

    return NextResponse.json({
      success: true,
      message: 'Webhook QRIS berhasil diproses dan kas telah dibukukan',
      data: result,
    })
  } catch (error: any) {
    console.error('Error processing QRIS webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal memproses webhook QRIS' },
      { status: 500 }
    )
  }
}

