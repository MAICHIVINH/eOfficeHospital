import { useState, useEffect } from 'react'
import {
    Calendar,
    User,
    Hash,
    FileText,
    Clock,
    Tag,
    Info,
    History,
    Building2
} from 'lucide-react'
import Modal from '../common/Modal'
import LoadingSpinner from '../common/LoadingSpinner'
import WorkflowStatusBadge from './WorkflowStatusBadge'
import WorkflowActionButtons from './WorkflowActionButtons'
import DocumentViewer from './DocumentViewer'
import OutgoingDocumentForm from './OutgoingDocumentForm'
import DocumentDistributionPanel from './DocumentDistributionPanel'
import DepartmentOpinionPanel from './DepartmentOpinionPanel'
import { getDocumentById } from '../../api/documentsApi'
import { getWorkflowHistory } from '../../api/outgoingWorkflowApi'
import { formatDate, formatDocumentType, formatSecurityLevel } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

/**
 * OutgoingDocumentDetailModal - Modal to view details and process outgoing document workflow
 */
const OutgoingDocumentDetailModal = ({ isOpen, onClose, documentId, onActionComplete }) => {
    const { t } = useTranslation()
    const [document, setDocument] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [isDraftFormOpen, setIsDraftFormOpen] = useState(false)

    /**
     * Translate workflow action from English to Vietnamese
     * @param {string} statusDisplayName - The English action message from backend
     * @returns {string} Translated Vietnamese action text
     */
    const translateWorkflowAction = (statusDisplayName) => {
        if (!statusDisplayName) return ''

        // Map English and Vietnamese action prefixes to translation keys
        const actionMappings = [
            { pattern: /^(Assigned drafting|Đã phân công soạn thảo)/i, key: 'outgoingWorkflow.historyActions.assignedDrafting' },
            { pattern: /^(Created draft outgoing document|Đã tạo bản thảo văn bản đi)/i, key: 'outgoingWorkflow.historyActions.createdDraft' },
            { pattern: /^(Reviewed content|Đã duyệt nội dung)/i, key: 'outgoingWorkflow.historyActions.reviewedContent' },
            { pattern: /^(Checked format|Đã kiểm tra thể thức)/i, key: 'outgoingWorkflow.historyActions.checkedFormat' },
            { pattern: /^(Submitted for signature|Đã trình ký)/i, key: 'outgoingWorkflow.historyActions.submittedForSignature' },
            { pattern: /^(Signed document|Đã ký)/i, key: 'outgoingWorkflow.historyActions.signedDocument' },
            { pattern: /^(Issued document|Đã ban hành)/i, key: 'outgoingWorkflow.historyActions.issuedDocument' },
            { pattern: /^(Published document|Đã phát hành)/i, key: 'outgoingWorkflow.historyActions.publishedDocument' },
            { pattern: /^(Archived document|Đã lưu trữ)/i, key: 'outgoingWorkflow.historyActions.archivedDocument' },
            { pattern: /^(Rejected content review|Từ chối duyệt nội dung)/i, key: 'outgoingWorkflow.historyActions.rejectedContent' },
            { pattern: /^(Rejected format check|Từ chối kiểm tra thể thức)/i, key: 'outgoingWorkflow.historyActions.rejectedFormat' },
            { pattern: /^(Rejected submission|Từ chối trình ký)/i, key: 'outgoingWorkflow.historyActions.rejectedSubmission' },
            { pattern: /^(Rejected signature|Từ chối ký văn bản)/i, key: 'outgoingWorkflow.historyActions.rejectedSignature' }
        ]

        // Find matching pattern and return translated text
        for (const { pattern, key } of actionMappings) {
            if (pattern.test(statusDisplayName)) {
                return t(key)
            }
        }

        // Fallback: return original if no match found
        return statusDisplayName
    }

    const fetchDocumentData = async () => {
        if (!documentId) return
        setLoading(true)
        try {
            const doc = await getDocumentById(documentId)
            console.log('Current document status:', doc.workflowStatus)
            setDocument(doc)

            // Fetch history
            setHistoryLoading(true)
            const historyData = await getWorkflowHistory(documentId)
            setHistory(historyData)
        } catch (error) {
            console.error('Failed to fetch document data:', error)
            toast.error(t('common.messages.loadFailed'))
        } finally {
            setLoading(false)
            setHistoryLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen && documentId) {
            fetchDocumentData()
        }
    }, [isOpen, documentId])

    const handleActionComplete = () => {
        fetchDocumentData()
        if (onActionComplete) {
            onActionComplete()
        }
    }

    if (!documentId) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('documents.viewDetail') + ' - ' + document?.title}
            maxWidth="max-w-7xl"
            maxHeight="max-h-[95vh]"
        >
            {loading ? (
                <div className="py-20">
                    <LoadingSpinner />
                </div>
            ) : document ? (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content: PDF Preview */}
                    <div className="w-full lg:w-2/3 space-y-4">
                        <div className="bg-gray-100 h-[850px] lg:h-auto dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner h-[850px]">
                            <DocumentViewer
                                documentId={document.id}
                                fileName={document.fileName}
                            />
                        </div>
                    </div>

                    {/* Right Side: Info, Actions & History */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6 h-[850px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Status & Actions Box */}
                        <section className="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-2xl border border-primary-100 dark:border-primary-900/30">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {t('outgoingWorkflow.currentStatus')}
                                </h4>
                                <WorkflowStatusBadge status={document.workflowStatus} size="sm" />
                            </div>

                            <div className="pt-4 border-t border-primary-100 dark:border-primary-900/30">
                                <WorkflowActionButtons
                                    document={document}
                                    onActionComplete={handleActionComplete}
                                    onOpenDraft={() => setIsDraftFormOpen(true)}
                                />
                            </div>
                        </section>
                        {/* Department Opinion Panel - shown when document is in opinion phase or after */}
                        {document && (document.workflowStatus?.toLowerCase() === 'pendingdepartmentopinion' || 
                                     ['unitreviewed', 'formatchecked', 'waitingforsign', 'signed', 'issued', 'sent', 'archived'].includes(document.workflowStatus?.toLowerCase())) && (
                            <div className="space-y-4">
                                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest text-center">--- Khu vực lấy ý kiến ---</div>
                                <DepartmentOpinionPanel 
                                    documentId={document.id} 
                                    onActionComplete={handleActionComplete} 
                                />
                            </div>
                        )}

                        {/* Distribution Panel - shown when document is Issued, Sent or Archived */}
                        {document && document.workflowStatus && 
                         ['issued', 'sent', 'archived'].includes(document.workflowStatus.toLowerCase()) && (
                            <div className="my-6">
                                <DocumentDistributionPanel documentId={document.id} />
                            </div>
                        )}

                        {/* General Info */}
                        <section className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-200/50 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary-500" />
                                {t('documents.generalInfo')}
                            </h4>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                                    {t('common.labels.name')}
                                </label>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {document.title}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                                            {t('documents.documentType')}
                                        </label>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {formatDocumentType(document.documentType)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                                            {t('documents.securityLevel')}
                                        </label>
                                        <span className={`badge ${document.securityLevel === 'Confidential'
                                            ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
                                            : document.securityLevel === 'Internal'
                                                ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                            } font-black text-[10px] uppercase tracking-wider border`}>
                                            {formatSecurityLevel(document.securityLevel)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                                                {t('common.labels.createdAt')}
                                            </label>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {formatDate(document.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                            <User className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                                                {t('common.labels.createdBy')}
                                            </label>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {document.createdByName}
                                            </p>
                                        </div>
                                    </div>

                                    {document.documentNumber && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                                <Hash className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                                                    {t('outgoingWorkflow.documentNumber')}
                                                </label>
                                                <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                                                    {document.documentNumber}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {document.description && (
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                                            {t('common.labels.description')}
                                        </label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                            {document.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>



                        {/* History Timeline */}
                        <section className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-200/50 dark:border-gray-800 flex-1">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <History className="w-4 h-4 text-indigo-500" />
                                {t('outgoingWorkflow.workflowHistory')}
                            </h4>

                            {historyLoading ? (
                                <div className="py-10">
                                    <LoadingSpinner />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-sm text-gray-400 italic">{t('common.labels.noData')}</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Vertical line */}
                                    <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

                                    <div className="space-y-8 relative">
                                        {history.map((item, index) => (
                                            <div key={index} className="flex gap-4 group">
                                                <div className="relative">
                                                    <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500 z-10 relative flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 -mt-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                            {translateWorkflowAction(item.statusDisplayName)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {formatDate(item.changedAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                        {item.changedByName}
                                                    </p>
                                                    {item.comment && (
                                                        <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm transition-colors group-hover:bg-gray-50 dark:group-hover:bg-gray-750">
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
                                                                "{item.comment}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            ) : null}



            <OutgoingDocumentForm 
                isOpen={isDraftFormOpen} 
                onClose={() => setIsDraftFormOpen(false)} 
                onSuccess={handleActionComplete}
                document={document}
            />
        </Modal>
    )
}

export default OutgoingDocumentDetailModal
