import { useState, useEffect } from 'react'
import { FileText, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { API_ENDPOINTS } from '../../utils/constants'

const PDFViewer = ({ documentId, fileName }) => {
    const [pdfUrl, setPdfUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true

        const fetchPdf = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENT_PREVIEW(documentId))

                if (!isMounted) return

                // Backend returns { url: "presigned-url" }
                if (response.data && response.data.url) {
                    setPdfUrl(response.data.url)
                } else {
                    throw new Error('Không nhận được đường dẫn xem trước.')
                }
                setLoading(false)
            } catch (err) {
                console.error('Error fetching PDF:', err)
                if (isMounted) {
                    setError('Không thể tải bản xem trước văn bản. Vui lòng tải về để xem.')
                    setLoading(false)
                }
            }
        }

        if (documentId) {
            fetchPdf()
        }

        return () => {
            isMounted = false
            // Note: Presigned URLs from backend don't need revokeObjectURL
        }
    }, [documentId])

    const handleDownload = async () => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENT_DOWNLOAD(documentId))
            if (response.data && response.data.url) {
                const link = document.createElement('a')
                link.href = response.data.url
                link.setAttribute('download', fileName || `document_${documentId}.pdf`)
                document.body.appendChild(link)
                link.click()
                link.parentNode.removeChild(link)
            }
        } catch (err) {
            console.error('Download error:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium text-lg">Đang chuẩn bị bản xem trước...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-lg border-2 border-dashed border-red-200 px-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-700 font-medium text-lg mb-2">{error}</p>
                <div className="flex gap-4 mt-4">
                    <button
                        onClick={handleDownload}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Tải văn bản về</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Mở trong tab mới</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-5 h-5 text-red-400 shrink-0" />
                    <span className="text-gray-200 font-medium truncate">{fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                        title="Tải về"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => window.open(pdfUrl, '_blank')}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                        title="Mở toàn màn hình"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="flex-1 w-full bg-gray-100 flex items-center justify-center">
                <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                />
            </div>
        </div>
    )
}

export default PDFViewer
