import { useTranslation } from 'react-i18next'
import { FileText, Calendar, User, Building2, Briefcase, CheckCircle, Clock, XCircle, Download, FileCheck } from 'lucide-react'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import { formatDate, formatRole, formatStatus, formatDocumentType, isOverdue } from '../../utils/formatters'
import { STATUS_COLORS } from '../../utils/constants'
import assignmentsApi from '../../api/assignmentsApi'
import toast from 'react-hot-toast'

const AssignmentDetailModal = ({ isOpen, onClose, assignment }) => {
    const { t } = useTranslation()

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'InProgress':
                return <Clock className="w-5 h-5 text-blue-500" />
            case 'Rejected':
                return <XCircle className="w-5 h-5 text-red-500" />
            default:
                return <Clock className="w-5 h-5 text-yellow-500" />
        }
    }

    const handleDownloadReport = async () => {
        try {
            const response = await assignmentsApi.getReportFileUrl(assignment.id)
            window.open(response.url, '_blank')
            toast.success(t('assignments.downloadReportSuccess'))
        } catch (error) {
            toast.error(error.response?.data?.message || t('assignments.downloadReportFailed'))
        }
    }

    if (!assignment) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('assignments.detailTitle')} maxWidth="max-w-lg">
            <div className="space-y-4">
                {/* Document Information */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-4">
                    <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {t('assignments.documentInfo')}
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px]">
                                {t('assignments.document')}:
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">
                                {assignment.documentTitle}
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px]">
                                {t('assignments.type')}:
                            </span>
                            <Badge variant="gray">{formatDocumentType(assignment.documentType)}</Badge>
                        </div>
                    </div>
                </div>

                {/* Assignment Information */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-4">
                    <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {t('assignments.assignmentInfo')}
                    </h3>
                    <div className="space-y-3">
                        {assignment.departmentName ? (
                            <div className="flex items-start gap-3">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px] flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    {t('common.labels.department')}:
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {assignment.departmentName}
                                </span>
                            </div>
                        ) : assignment.assignedToUserName ? (
                            <div className="flex items-start gap-3">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px] flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {t('assignments.personal')}:
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {assignment.assignedToUserName}
                                </span>
                            </div>
                        ) : null}
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px]">
                                {t('assignments.role')}:
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${assignment.assignedRole === 'Main'
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 border border-primary-100 dark:border-primary-800'
                                : 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-100 dark:border-slate-800'
                                }`}>
                                {formatRole(assignment.assignedRole)}
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px]">
                                {t('assignments.status')}:
                            </span>
                            <Badge variant={STATUS_COLORS[assignment.status] || 'gray'}>
                                <span className="flex items-center gap-2">
                                    {getStatusIcon(assignment.status)}
                                    {formatStatus(assignment.status)}
                                </span>
                            </Badge>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px] flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {t('assignments.assignedBy')}:
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {assignment.assignedByName}
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px] flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {t('assignments.assignedDate')}:
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {formatDate(assignment.assignedAt)}
                            </span>
                        </div>
                        {assignment.deadline && (
                            <div className="flex items-start gap-3">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px] flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-red-500" />
                                    {t('assignments.deadline') || 'Hạn xử lý'}:
                                </span>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${isOverdue(assignment.deadline) && assignment.status !== 'Completed' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {formatDate(assignment.deadline)}
                                    </span>
                                    {isOverdue(assignment.deadline) && assignment.status !== 'Completed' && (
                                        <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter w-fit animate-pulse mt-1">
                                            {t('documents.overdue') || 'QUÁ HẠN'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        {assignment.completedAt && (
                            <div className="flex items-start gap-3">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 min-w-[140px] flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {t('assignments.completedDate')}:
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {formatDate(assignment.completedAt)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {assignment.notes && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-4">
                        <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            {t('assignments.notes')}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {assignment.notes}
                        </p>
                    </div>
                )}

                {/* Report File */}
                {assignment.reportFileName && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-4">
                        <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            {t('assignments.reportFile')}
                        </h3>
                        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                        {assignment.reportFileName}
                                    </p>
                                    {assignment.reportFileSize && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(assignment.reportFileSize / 1024).toFixed(2)} KB
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleDownloadReport}
                                className="btn btn-primary py-2 px-4 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                {t('common.actions.download')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end pt-5 border-t border-gray-100 dark:border-gray-800 transition-colors">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary py-2.5 px-6 text-sm font-black uppercase tracking-widest"
                    >
                        {t('common.actions.close')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default AssignmentDetailModal
