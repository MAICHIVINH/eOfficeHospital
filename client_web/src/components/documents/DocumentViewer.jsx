import { useState, useEffect } from 'react'
import { FileText, Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react'
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer'
import axiosInstance from '../../api/axiosInstance'
import { API_ENDPOINTS } from '../../utils/constants'

// Import styles for react-pdf layers used by the viewer
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import '@cyntler/react-doc-viewer/dist/index.css'

const DocumentViewer = ({ documentId, fileName }) => {
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true

        const fetchDocUrl = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENT_PREVIEW(documentId))

                if (!isMounted) return

                if (response.data && response.data.url) {
                    setDocs([
                        {
                            uri: response.data.url,
                            fileType: fileName?.split('.').pop().toLowerCase(),
                            fileName: fileName,
                        }
                    ])
                } else {
                    throw new Error('Không nhận được đường dẫn xem trước.')
                }
                setLoading(false)
            } catch (err) {
                console.error('Error fetching document preview:', err)
                if (isMounted) {
                    setError('Không thể tải bản xem trước văn bản. Vui lòng tải về để xem.')
                    setLoading(false)
                }
            }
        }

        if (documentId) {
            fetchDocUrl()
        }

        return () => {
            isMounted = false
        }
    }, [documentId, fileName])

    const handleDownload = async () => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENT_DOWNLOAD(documentId))
            if (response.data && response.data.url) {
                const link = document.createElement('a')
                link.href = response.data.url
                link.setAttribute('download', fileName || `document_${documentId}`)
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
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Đang chuẩn bị bản xem trước...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-900/10 rounded-lg border-2 border-dashed border-red-200 dark:border-red-900/30 px-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-700 dark:text-red-400 font-medium text-lg mb-2">{error}</p>
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
        <div className="w-full h-[1000px] min-h-[500px] flex flex-col bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-5 h-5 text-blue-400 shrink-0" />
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
                        onClick={() => window.open(docs[0]?.uri, '_blank')}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                        title="Mở toàn màn hình"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="flex-1 w-full bg-white dark:bg-gray-900 border-none">
                <DocViewer
                    documents={docs}
                    pluginRenderers={DocViewerRenderers}
                    theme={{
                        primary: '#3b82f6',
                        secondary: '#ffffff',
                        tertiary: '#f3f4f6',
                        textPrimary: '#111827',
                        textSecondary: '#6b7280',
                        textTertiary: '#9ca3af',
                        disableThemeScrollbar: false,
                    }}
                    config={{
                        header: {
                            disableHeader: true,
                            disableFileName: true,
                            retainURLParams: false,
                        },
                        pdfVerticalScrollByDefault: true,
                    }}
                    prefetchMethod="GET"
                    style={{ height: '100%', border: 'none' }}
                />
            </div>
        </div>
    )
}

export default DocumentViewer
