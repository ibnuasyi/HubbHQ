export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getQrisConfig, injectQrisAmount } from '@/lib/qris'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { month, year, amount, targetUserId } = body

    const targetUser = targetUserId || session.user.id
    const finalMonth = parseInt(month) || new Date().getMonth() + 1
    const finalYear = parseInt(year) || new Date().getFullYear()
    const baseAmount = Math.max(1000, parseFloat(amount) || 20000)

    // Periksa apakah sudah ada entri KasPayment untuk bulan & tahun ini
    let payment = await prisma.kasPayment.findUnique({
      where: {
        userId_month_year: {
          userId: targetUser,
          month: finalMonth,
          year: finalYear,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (payment?.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Iuran kas untuk periode bulan ini sudah lunas sebelumnya.' },
        { status: 400 }
      )
    }

    const qrisConfig = await getQrisConfig()

    if (qrisConfig.mode === 'DISABLED') {
      return NextResponse.json(
        {
          error:
            'Pembayaran QRIS saat ini dinonaktifkan oleh bendahara organisasi. Silakan gunakan metode transfer rekening manual.',
        },
        { status: 400 }
      )
    }

    // ==================== OPSIONAL: PENDEKATAN B (QRIS MANDIRI / REKENING ORGANISASI) ====================
    if (qrisConfig.mode === 'MANDIRI') {
      const mandiri = qrisConfig.mandiri
      const uniqueCode = mandiri.useUniqueCode
        ? Math.floor(100 + Math.random() * 899)
        : 0
      const totalAmount = baseAmount + uniqueCode
      const paymentRef = `KAS-MAN-${finalYear}${finalMonth.toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`

      let finalQrisPayload = mandiri.staticQrisString?.trim() || ''
      if (finalQrisPayload) {
        const injected = injectQrisAmount(finalQrisPayload, totalAmount)
        if (injected) finalQrisPayload = injected
      }

      // Generate Data URL QR jika ada payload
      let qrCodeDataUrl = ''
      if (finalQrisPayload) {
        qrCodeDataUrl = await QRCode.toDataURL(finalQrisPayload, {
          width: 320,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
      } else if (mandiri.qrisImageUrl) {
        qrCodeDataUrl = mandiri.qrisImageUrl
      }

      // Upsert KasPayment
      const savedPayment = await prisma.kasPayment.upsert({
        where: {
          userId_month_year: {
            userId: targetUser,
            month: finalMonth,
            year: finalYear,
          },
        },
        update: {
          amount: baseAmount,
          paidAmount: totalAmount,
          paymentMethod: 'MANDIRI_QRIS',
          paymentRef,
          qrisString: finalQrisPayload || null,
        },
        create: {
          userId: targetUser,
          month: finalMonth,
          year: finalYear,
          amount: baseAmount,
          paidAmount: totalAmount,
          status: 'PENDING',
          paymentMethod: 'MANDIRI_QRIS',
          paymentRef,
          qrisString: finalQrisPayload || null,
        },
      })

      return NextResponse.json({
        success: true,
        mode: 'MANDIRI',
        data: {
          paymentId: savedPayment.id,
          paymentRef,
          baseAmount,
          uniqueCode,
          totalAmount,
          qrCodeDataUrl,
          merchantName: mandiri.merchantName,
          bankName: mandiri.bankName,
          accountNumber: mandiri.accountNumber,
          accountHolder: mandiri.accountHolder,
          instructions: mandiri.instructions,
        },
      })
    }

    // ==================== OPSIONAL: PENDEKATAN A (PAYMENT GATEWAY OTOMATIS) ====================
    if (qrisConfig.mode === 'GATEWAY') {
      const gw = qrisConfig.gateway
      const totalAmount = baseAmount
      const paymentRef = `KAS-GW-${finalYear}${finalMonth.toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`

      let qrCodeDataUrl = ''
      let qrisRawString = ''

      // 1. PROVIDER SIMULASI (Cocok untuk uji coba lokal tanpa daftar merchant)
      if (gw.provider === 'simulation') {
        qrisRawString = `00020101021226680016ID.CO.HUBBHQ.WWW0118936009180000000000520453995303360540${totalAmount.toString().length}${totalAmount}5802ID5918HUBBHQ SIMULATOR6007JAKARTA6304`
        qrCodeDataUrl = await QRCode.toDataURL(qrisRawString, {
          width: 320,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
      }

      // 2. PROVIDER TRIPAY (Jika konfigurasi Tripay aktif)
      else if (gw.provider === 'tripay' && gw.apiKey && gw.merchantCode) {
        try {
          const endpoint = gw.isProduction
            ? 'https://tripay.co.id/api/transaction/create'
            : 'https://tripay.co.id/api-sandbox/transaction/create'

          const tripayRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${gw.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              method: 'QRIS',
              merchant_ref: paymentRef,
              amount: totalAmount,
              customer_name: session.user.name || 'Anggota HubbHQ',
              customer_email: session.user.email || 'anggota@hubbhq.org',
              order_items: [
                {
                  name: `Iuran Kas Bulan ${finalMonth}/${finalYear}`,
                  price: totalAmount,
                  quantity: 1,
                },
              ],
            }),
          })

          const tripayJson = await tripayRes.json()
          if (tripayJson.success && tripayJson.data) {
            qrCodeDataUrl = tripayJson.data.qr_url || tripayJson.data.qr_string
            qrisRawString = tripayJson.data.qr_string || ''
          }
        } catch (tripayErr) {
          console.error('Tripay API error, fallback to simulation:', tripayErr)
        }
      }

      // 3. PROVIDER MIDTRANS (Jika konfigurasi Midtrans aktif)
      else if (gw.provider === 'midtrans' && gw.apiKey) {
        try {
          const endpoint = gw.isProduction
            ? 'https://api.midtrans.com/v2/charge'
            : 'https://api.sandbox.midtrans.com/v2/charge'

          const authHeader = Buffer.from(`${gw.apiKey}:`).toString('base64')
          const midtransRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${authHeader}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              payment_type: 'qris',
              transaction_details: {
                order_id: paymentRef,
                gross_amount: totalAmount,
              },
              customer_details: {
                first_name: session.user.name || 'Anggota',
                email: session.user.email || 'anggota@hubbhq.org',
              },
            }),
          })

          const midtransJson = await midtransRes.json()
          if (midtransJson.actions && midtransJson.actions.length > 0) {
            const qrAction = midtransJson.actions.find(
              (a: any) => a.name === 'generate-qr-code'
            )
            if (qrAction) {
              qrCodeDataUrl = qrAction.url
            }
          }
        } catch (midtransErr) {
          console.error('Midtrans API error, fallback to simulation:', midtransErr)
        }
      }

      // Fallback jika API gateway eksternal belum diisi kredensialnya
      if (!qrCodeDataUrl) {
        qrisRawString = `00020101021226680016ID.CO.HUBBHQ.WWW0118936009180000000000520453995303360540${totalAmount.toString().length}${totalAmount}5802ID5914HUBBHQ GATEWAY6007JAKARTA6304`
        qrCodeDataUrl = await QRCode.toDataURL(qrisRawString, {
          width: 320,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
      }

      // Upsert KasPayment
      const savedPayment = await prisma.kasPayment.upsert({
        where: {
          userId_month_year: {
            userId: targetUser,
            month: finalMonth,
            year: finalYear,
          },
        },
        update: {
          amount: baseAmount,
          paidAmount: totalAmount,
          paymentMethod: 'GATEWAY_QRIS',
          paymentRef,
          qrisString: qrisRawString || null,
        },
        create: {
          userId: targetUser,
          month: finalMonth,
          year: finalYear,
          amount: baseAmount,
          paidAmount: totalAmount,
          status: 'PENDING',
          paymentMethod: 'GATEWAY_QRIS',
          paymentRef,
          qrisString: qrisRawString || null,
        },
      })

      return NextResponse.json({
        success: true,
        mode: 'GATEWAY',
        provider: gw.provider,
        data: {
          paymentId: savedPayment.id,
          paymentRef,
          totalAmount,
          qrCodeDataUrl,
          isSimulation: gw.provider === 'simulation',
        },
      })
    }

    return NextResponse.json(
      { error: 'Mode konfigurasi pembayaran tidak dikenali' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error generating QRIS payment:', error)
    return NextResponse.json(
      { error: 'Gagal membuat tagihan pembayaran QRIS' },
      { status: 500 }
    )
  }
}

