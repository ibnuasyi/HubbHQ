'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  Loader2,
  Book,
  FileText,
  File,
  Eye,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface LibraryBook {
  id: string
  title: string
  author: string | null
  description: string | null
  category: string | null
  fileUrl: string
  fileType: string
  fileSize: number | null
  viewCount: number
  downloadCount: number
  uploadedAt: string
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
  if (fileType.includes('epub')) return <Book className="h-8 w-8 text-blue-500" />
  return <File className="h-8 w-8 text-gray-500" />
}

export default function LibraryPage() {
  const [books, setBooks] = React.useState<LibraryBook[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [showAdd, setShowAdd] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)
  const [showReader, setShowReader] = React.useState(false)
  const [selectedBook, setSelectedBook] = React.useState<LibraryBook | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [pdfDocument, setPdfDocument] = React.useState<any>(null)
  const [numPages, setNumPages] = React.useState<number>(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [scale, setScale] = React.useState(1.0)
  const [loadingPdf, setLoadingPdf] = React.useState(false)

  const limit = 12

  const fetchBooks = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append('search', search)

      const res = await fetch(`/api/library?${params}`)
      const data = await res.json()

      if (data.data) {
        setBooks(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  React.useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file || file.size === 0) {
      alert('Pilih file PDF atau EPUB')
      setUploading(false)
      return
    }

    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setShowAdd(false)
        fetchBooks()
      }
    } catch (error) {
      console.error('Error uploading:', error)
    } finally {
      setUploading(false)
    }
  }

  const viewBook = async (book: LibraryBook) => {
    setSelectedBook(book)
    setShowDetail(true)
  }

  const openReader = async (book: LibraryBook) => {
    setSelectedBook(book)
    setShowReader(true)
    setCurrentPage(1)
    setScale(1.0)
    setLoadingPdf(true)

    if (book.fileType.includes('pdf')) {
      try {
        // Load PDF using pdf.js
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const loadingTask = pdfjsLib.getDocument({ url: book.fileUrl })
        const pdf = await loadingTask.promise
        setPdfDocument(pdf)
        setNumPages(pdf.numPages)
      } catch (error) {
        console.error('Error loading PDF:', error)
        alert('Gagal memuat PDF')
      }
    }
    setLoadingPdf(false)
  }

  const closeReader = () => {
    setShowReader(false)
    setPdfDocument(null)
    setNumPages(0)
    setCurrentPage(1)
    setScale(1.0)
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const renderPdfPage = () => {
    if (!pdfDocument || loadingPdf) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Memuat dokumen...</p>
        </div>
      )
    }

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
      const renderPage = async () => {
        try {
          const page = await pdfDocument.getPage(currentPage)
          const viewport = page.getViewport({ scale })
          const canvas = canvasRef.current
          if (!canvas) return

          const context = canvas.getContext('2d')
          if (!context) return

          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise
        } catch (error) {
          console.error('Error rendering page:', error)
        }
      }

      renderPage()
    }, [pdfDocument, currentPage, scale])

    return (
      <div className="flex justify-center overflow-auto max-h-full p-4">
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-muted-foreground">
            Koleksi buku digital ({total} buku)
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Buku
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari buku..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Book className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>Belum ada buku</p>
              <Button variant="link" onClick={() => setShowAdd(true)}>
                Upload buku pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => (
                  <Card
                    key={book.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => viewBook(book)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-lg bg-muted">
                          {getFileIcon(book.fileType)}
                        </div>
                        <Badge variant="outline">{book.category || 'Umum'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="line-clamp-2 text-base">
                        {book.title}
                      </CardTitle>
                      {book.author && (
                        <CardDescription className="mt-1">
                          {book.author}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {book.viewCount}
                        </span>
                        <span>{formatFileSize(book.fileSize)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Buku</DialogTitle>
            <DialogDescription>
              Upload buku dalam format PDF atau EPUB
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Buku *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Judul buku"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Penulis</Label>
              <Input id="author" name="author" placeholder="Nama penulis" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" name="category" placeholder="Kategori buku" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                name="description"
                placeholder="Deskripsi singkat buku"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File (PDF/EPUB) *</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.epub,application/pdf,application/epub+zip"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBook?.title}</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-muted rounded-lg">
                {getFileIcon(selectedBook.fileType)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Penulis</p>
                  <p className="font-medium">{selectedBook.author || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kategori</p>
                  <p className="font-medium">{selectedBook.category || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ukuran File</p>
                  <p className="font-medium">{formatFileSize(selectedBook.fileSize)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dilihat</p>
                  <p className="font-medium">{selectedBook.viewCount} kali</p>
                </div>
              </div>
              {selectedBook.description && (
                <div>
                  <p className="text-muted-foreground">Deskripsi</p>
                  <p>{selectedBook.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetail(false)}
            >
              Tutup
            </Button>
            <Button onClick={() => { setShowDetail(false); openReader(selectedBook!) }}>
              <Eye className="mr-2 h-4 w-4" />
              Baca Buku
            </Button>
            <Button
              variant="outline"
              onClick={() => selectedBook && window.open(selectedBook.fileUrl, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Reader Dialog */}
      <Dialog open={showReader} onOpenChange={setShowReader}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">{selectedBook?.title}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeReader}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* PDF Controls */}
          <div className="flex items-center justify-between py-2 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage <= 1 || !pdfDocument}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <span className="text-sm">
                {numPages > 0 ? `${currentPage} / ${numPages}` : '-'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= numPages || !pdfDocument}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {numPages > 0 && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={numPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= numPages) {
                      setCurrentPage(page)
                    }
                  }}
                  className="w-16 h-8 text-center"
                />
                <span className="text-sm text-muted-foreground">/ {numPages}</span>
              </div>
            )}
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden bg-gray-100 rounded-lg">
            {selectedBook?.fileType.includes('pdf') ? (
              pdfDocument ? (
                <div className="h-full overflow-auto flex justify-center">
                  <PdfViewer
                    pdfDocument={pdfDocument}
                    currentPage={currentPage}
                    scale={scale}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="ml-2 text-muted-foreground">Memuat dokumen...</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Book className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Format EPUB belum didukung untuk preview
                </p>
                <Button onClick={() => window.open(selectedBook?.fileUrl, '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download untuk Membaca
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// PDF Viewer Component
interface PdfViewerProps {
  pdfDocument: any
  currentPage: number
  scale: number
}

function PdfViewer({ pdfDocument, currentPage, scale }: PdfViewerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage)
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise
      } catch (error) {
        console.error('Error rendering page:', error)
      }
    }

    renderPage()
  }, [pdfDocument, currentPage, scale])

  return <canvas ref={canvasRef} className="shadow-lg" />
}
