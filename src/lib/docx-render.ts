import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

export const RESERVED_DOCX_VARS = new Set([
  'nomor_surat',
  'tanggal_surat',
  'nama_organisasi',
  'sub_nama_organisasi',
  'alamat_organisasi',
  'kontak_organisasi',
  'kota',
  'nama_pembuat',
  'nama_pemohon',
  'jabatan_penandatangan',
  'nama_penandatangan',
  'nra_penandatangan',
  'qr_verifikasi',
  'url_verifikasi',
  'perihal',
])

export interface ExtractedDocxVariable {
  name: string
  kind: 'field' | 'list'
  label: string
  type: 'text' | 'textarea' | 'date' | 'number'
}

/**
 * Validates DOCX buffer for safety (prevents Zip Bomb, Macro injection, and Corrupted files)
 */
export function assertSafeDocx(buf: Buffer): void {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
  const MAX_UNCOMPRESSED = 60 * 1024 * 1024 // 60 MB
  const MAX_ENTRIES = 500
  const MAX_RATIO = 100

  if (!buf || buf.length === 0) {
    throw new Error('Berkas kosong')
  }

  if (buf.length > MAX_FILE_SIZE) {
    throw new Error('Ukuran berkas melebihi batas maksimal 10 MB')
  }

  // 1. Check ZIP magic bytes (PK\x03\x04)
  if (buf[0] !== 0x50 || buf[1] !== 0x4b || buf[2] !== 0x03 || buf[3] !== 0x04) {
    throw new Error('Format berkas tidak valid, bukan berkas Word (.docx) yang sah')
  }

  // 2. Parse ZIP structure
  let zip: PizZip
  try {
    zip = new PizZip(buf)
  } catch (err: any) {
    throw new Error('Gagal membaca arsip berkas .docx: ' + (err?.message || 'Arsip rusak'))
  }

  const names = Object.keys(zip.files)
  if (names.length > MAX_ENTRIES) {
    throw new Error('Berkas memiliki terlalu banyak entri')
  }

  // 3. Must have valid OpenXML document structure
  if (!names.includes('[Content_Types].xml') || !names.includes('word/document.xml')) {
    throw new Error('Struktur berkas .docx tidak lengkap (word/document.xml tidak ditemukan)')
  }

  // Reject macro-enabled files (.docm)
  if (names.some((n) => /vbaProject\.bin$/i.test(n))) {
    throw new Error('Berkas mengandung makro VBA yang tidak diizinkan demi keamanan')
  }

  // 4. Calculate uncompressed size (zip bomb protection)
  let totalUncompressed = 0
  for (const n of names) {
    if (n.includes('..') || n.startsWith('/') || n.startsWith('\\')) {
      throw new Error('Nama entri berkas di dalam arsip tidak aman (Path Traversal detected)')
    }
    const uncompressedSize = (zip.files[n] as any)?._data?.uncompressedSize ?? 0
    totalUncompressed += uncompressedSize
  }

  if (totalUncompressed > MAX_UNCOMPRESSED || (buf.length > 0 && totalUncompressed / buf.length > MAX_RATIO)) {
    throw new Error('Rasio kompresi berkas mencurigakan (Potensi Zip Bomb terdeteksi)')
  }
}

/**
 * Extracts template placeholders from DOCX paragraphs
 */
export function extractDocxVariables(buf: Buffer): ExtractedDocxVariable[] {
  assertSafeDocx(buf)
  const zip = new PizZip(buf)
  const parts = Object.keys(zip.files).filter((n) =>
    /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)
  )

  const varsMap = new Map<string, ExtractedDocxVariable>()

  for (const part of parts) {
    const file = zip.file(part)
    if (!file) continue
    const xml = file.asText()

    // Process per paragraph, merge <w:t> tags
    const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []
    for (const para of paragraphs) {
      const text = (para.match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? [])
        .map((t) => t.replace(/<[^>]+>/g, ''))
        .join('')

      const matches = text.matchAll(/\{\s*([#^/]?)\s*([a-zA-Z_][\w.]*)\s*\}/g)
      for (const m of matches) {
        const [, sigil, rawName] = m
        const name = rawName.trim().toLowerCase()
        if (sigil === '/' || RESERVED_DOCX_VARS.has(name)) continue

        const kind = sigil === '#' || sigil === '^' ? 'list' : 'field'
        if (!varsMap.has(name) || kind === 'list') {
          // Infer type & human readable label
          let type: ExtractedDocxVariable['type'] = 'text'
          if (name.includes('tanggal') || name.includes('tgl') || name.includes('date')) {
            type = 'date'
          } else if (name.includes('jumlah') || name.includes('nominal') || name.includes('total') || name.includes('biaya')) {
            type = 'number'
          } else if (name.includes('isi') || name.includes('keterangan') || name.includes('deskripsi') || name.includes('catatan') || name.includes('alamat')) {
            type = 'textarea'
          }

          const label = name
            .split('_')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ')

          varsMap.set(name, { name, kind, label, type })
        }
      }
    }
  }

  return Array.from(varsMap.values())
}

/**
 * Renders DOCX with data and returns resulting Buffer
 */
export function renderDocx(templateBuf: Buffer, data: Record<string, unknown>): Buffer {
  assertSafeDocx(templateBuf)
  const zip = new PizZip(templateBuf)

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })

  doc.render(data)
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

/**
 * Generates an official, standard Indonesian organizational letter DOCX template
 */
export function generateDefaultDocxTemplate(orgInfo?: {
  namaOrganisasi?: string
  subNamaOrganisasi?: string
  alamatOrganisasi?: string
  kontakOrganisasi?: string
}): Buffer {
  const orgName = orgInfo?.namaOrganisasi || 'PENGURUS BESAR ORGANISASI'
  const orgSub = orgInfo?.subNamaOrganisasi || 'SISTEM INFORMASI PERSURATAN & ADMINISTRASI HUBBHQ'
  const orgAlamat = orgInfo?.alamatOrganisasi || 'Sekretariat Utama Organisasi'
  const orgKontak = orgInfo?.kontakOrganisasi || 'Telp / Email Resmi Organisasi'

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- KOP SURAT -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        </w:rPr>
        <w:t>${orgName}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        </w:rPr>
        <w:t>${orgSub}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="18"/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        </w:rPr>
        <w:t>${orgAlamat} | ${orgKontak}</w:t>
      </w:r>
    </w:p>

    <!-- GARIS PEMISAH KOP -->
    <w:p>
      <w:pPr>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="18" w:space="1" w:color="000000"/>
        </w:pBdr>
      </w:pPr>
    </w:p>

    <!-- TANGGAL DAN TEMPAT -->
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{kota}, {tanggal_surat}</w:t>
      </w:r>
    </w:p>

    <!-- METADATA SURAT -->
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Nomor       : {nomor_surat}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Lampiran : -</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Perihal     : {perihal}</w:t>
      </w:r>
    </w:p>

    <!-- TUJUAN -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Kepada Yth,</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{tujuan_surat}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>di Tempat</w:t>
      </w:r>
    </w:p>

    <!-- SALAM PEMBUKA -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Assalamu'alaikum Wr. Wb.</w:t>
      </w:r>
    </w:p>

    <!-- ISI SURAT -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:spacing w:after="120" w:line="360" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{isi_surat}</w:t>
      </w:r>
    </w:p>

    <!-- PENUTUP -->
    <w:p>
      <w:pPr>
        <w:jc w:val="both"/>
        <w:spacing w:before="120" w:after="240" w:line="360" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Demikian surat ini kami sampaikan. Atas perhatian, dukungan, dan kerja sama yang diberikan, kami ucapkan terima kasih.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>Wassalamu'alaikum Wr. Wb.</w:t>
      </w:r>
    </w:p>

    <!-- TANDA TANGAN -->
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:before="360" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{nama_organisasi}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
        <w:spacing w:after="800"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{jabatan_penandatangan},</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:u w:val="single"/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="22"/>
        </w:rPr>
        <w:t>{nama_penandatangan}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="right"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>NRA: {nra_penandatangan}</w:t>
      </w:r>
    </w:p>

    <!-- VERIFIKASI QR -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="360"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="16"/>
          <w:color w:val="666666"/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        </w:rPr>
        <w:t>Verifikasi keabsahan surat resmi ini secara online di: {url_verifikasi}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

  const zip = new PizZip()
  zip.file('[Content_Types].xml', contentTypesXml)
  zip.file('_rels/.rels', relsXml)
  zip.file('word/document.xml', documentXml)

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
}

