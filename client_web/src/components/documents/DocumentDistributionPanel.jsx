import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
    Building2, Globe, CheckCircle, Clock, AlertCircle, Upload,
    RefreshCw, ChevronDown, ChevronUp, FileText, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
    getDistributions,
    confirmExternalReceipt,
    updateDistributionStatus,
    uploadDistributionReport,
    downloadDistributionReport
} from '../../api/documentDistributionApi'

const DocumentDistributionPanel = ({ documentId }) => {
    const { t } = useTranslation()
    const { user } = useSelector(state => state.auth)
    const [distributions, setDistributions] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(true)
    const [uploadingId, setUploadingId] = useState(null)

    const STATUS_COLORS = {
        Sent:       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        Received:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        InProgress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        Completed:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    }

    const getStatusLabel = (status) => t(`outgoingWorkflow.distribution.status.${status}`) || status

    const isClerk = user?.role === 'CLERK' || user?.role === 'ADMIN'
    const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'

    useEffect(() => {
        load()
    }, [documentId])

    const load = async () => {
        setLoading(true)
        try {
            const data = await getDistributions(documentId)
            setDistributions(data || [])
        } catch {
            setDistributions([])
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmExternal = async (dist) => {
        try {
            await confirmExternalReceipt(dist.id, { isReceived: true, receivedAt: new Date().toISOString() })
            toast.success('Đã xác nhận đối tác nhận văn bản')
            load()
        } catch {
            toast.error('Xác nhận thất bại')
        }
    }

    // Map string status to integer enum for backend
    const STATUS_MAP = {
        'Sent': 1,
        'Received': 2,
        'InProgress': 3,
        'Completed': 4
    }

    const handleStatusUpdate = async (dist, newStatus) => {
        try {
            const statusValue = STATUS_MAP[newStatus] || newStatus;
            await updateDistributionStatus(dist.id, { status: statusValue })
            toast.success('Cập nhật trạng thái thành công')
            load()
        } catch (error) {
            console.error('Update status error:', error)
            toast.error('Cập nhật thất bại')
        }
    }

    const handleReportUpload = async (dist, file) => {
        setUploadingId(dist.id)
        try {
            await uploadDistributionReport(dist.id, file)
            toast.success('Nộp báo cáo kết quả thành công')
            load()
        } catch {
            toast.error('Nộp báo cáo thất bại')
        } finally {
            setUploadingId(null)
        }
    }

    const handleDownloadReport = async (dist) => {
        try {
            const blob = await downloadDistributionReport(dist.id)
            const url = window.URL.createObjectURL(new Blob([blob]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', dist.reportFileName || 'report.pdf')
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Tải xuống thất bại')
        }
    }

    if (loading) return (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse h-20" />
    )

    if (distributions.length === 0) return null

    const internal = distributions.filter(d => d.distributionType === 'Internal')
    const external = distributions.filter(d => d.distributionType === 'External')

    return (
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('outgoingWorkflow.distribution.info')} ({distributions.length})
                </span>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {/* Internal distributions */}
                    {internal.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    {t('outgoingWorkflow.distribution.internal')} ({internal.length} {t('departments.title')?.toLowerCase() || 'khoa/phòng'})
                                </span>
                            </div>
                            <div className="space-y-3">
                                {internal.map(dist => (
                                    <div key={dist.id} className="flex items-start justify-between gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {dist.departmentName || t('common.labels.unknown')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {t('outgoingWorkflow.distribution.sentAt')}: {new Date(dist.sentAt).toLocaleDateString('vi-VN')}
                                            </p>
                                            {dist.reportFileName && (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> {dist.reportFileName}
                                                    </p>
                                                    <button 
                                                        onClick={() => handleDownloadReport(dist)}
                                                        className="text-blue-600 hover:text-blue-800 p-0.5"
                                                        title={t('common.actions.download')}
                                                    >
                                                        <Download className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[dist.status] || ''}`}>
                                                {getStatusLabel(dist.status)}
                                            </span>

                                            {/* Manager actions: only for the assigned department */}
                                            {isManager && dist.departmentId === user.departmentId && dist.status === 'Sent' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(dist, 'Received')}
                                                    className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    {t('outgoingWorkflow.distribution.confirmReceipt')}
                                                </button>
                                            )}
                                            {isManager && dist.departmentId === user.departmentId && dist.status === 'Received' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(dist, 'InProgress')}
                                                    className="text-xs px-2.5 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                                >
                                                    {t('outgoingWorkflow.distribution.status.InProgress')}
                                                </button>
                                            )}
                                            {isManager && dist.departmentId === user.departmentId && (dist.status === 'InProgress' || dist.status === 'Received') && !dist.reportFileName && (
                                                <label className="cursor-pointer text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1">
                                                    {uploadingId === dist.id ? (
                                                        <><RefreshCw className="w-3 h-3 animate-spin" /> {t('common.actions.saving')}...</>
                                                    ) : (
                                                        <><Upload className="w-3 h-3" /> {t('outgoingWorkflow.distribution.reportUpload')}</>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.doc,.docx"
                                                        onChange={e => e.target.files?.[0] && handleReportUpload(dist, e.target.files[0])}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* External distributions */}
                    {external.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                                    {t('outgoingWorkflow.distribution.external')}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {external.map(dist => (
                                    <div key={dist.id} className="flex items-start justify-between gap-3 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {dist.externalRecipientName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {t('outgoingWorkflow.distribution.sentAt')}: {new Date(dist.sentAt).toLocaleDateString('vi-VN')}
                                            </p>
                                            {dist.isExternalReceived && dist.externalReceivedAt && (
                                                <p className="text-xs text-green-600 mt-0.5">
                                                    ✓ {t('outgoingWorkflow.distribution.status.Received')}: {new Date(dist.externalReceivedAt).toLocaleDateString('vi-VN')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                dist.isExternalReceived
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                            }`}>
                                                {dist.isExternalReceived ? t('outgoingWorkflow.distribution.status.Received') : t('outgoingWorkflow.distribution.status.Sent')}
                                            </span>
                                            {isClerk && !dist.isExternalReceived && (
                                                <button
                                                    onClick={() => handleConfirmExternal(dist)}
                                                    className="text-xs px-2.5 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    {t('outgoingWorkflow.distribution.confirmReceipt')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default DocumentDistributionPanel
