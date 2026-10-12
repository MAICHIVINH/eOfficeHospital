import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
    CheckCircle, FileSignature,
    Hash, Upload as UploadIcon, Archive, XCircle, Eye,
    MessageSquare
} from 'lucide-react'
import {
    reviewContent, signDocument, issueDocument, archiveDocument
} from '../../api/outgoingWorkflowApi'
import {
    rejectContentReview, rejectFormatCheck,
    updateDocument, deleteDocument
} from '../../api/documentsApi'
import {
    approveIncomingDocument,
    rejectIncomingDocument,
    archiveDocument as archiveIncomingDocument
} from '../../api/incomingWorkflowApi'
import { PERMISSIONS, WORKFLOW_STATUS, DOCUMENT_CATEGORY } from '../../utils/constants'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import RejectDocumentModal from './RejectDocumentModal'
import DocumentProcessingPreviewModal from './DocumentProcessingPreviewModal'
import PublishDocumentModal from './PublishDocumentModal'
import DepartmentOpinionModal from './DepartmentOpinionModal'

/**
 * WorkflowActionButtons - Render action buttons based on workflow status and user permissions
 * @param {Object} props
 * @param {Object} props.document - Document object with workflowStatus
 * @param {Function} props.onActionComplete - Callback after successful action
 * @returns {JSX.Element}
 */
const WorkflowActionButtons = ({ document, onActionComplete, onOpenAssign, onOpenDraft }) => {
    const { t } = useTranslation()
    const { user } = useSelector((state) => state.auth)
    const [isLoading, setIsLoading] = useState(false)
    const [showCommentModal, setShowCommentModal] = useState(false)
    const [showIssueModal, setShowIssueModal] = useState(false)
    const [showSignScanModal, setShowSignScanModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [showOpinionModal, setShowOpinionModal] = useState(false)
    const [currentAction, setCurrentAction] = useState(null)
    const [comment, setComment] = useState('')
    const [documentNumber, setDocumentNumber] = useState('')
    const [scanFile, setScanFile] = useState(null)

    const userPermissions = user?.permissions || []
    const userRole = user?.role || ''

    const hasPermission = (permission) => {
        // Fallback: Admin has all permissions
        if (userRole === 'ADMIN') return true

        return userPermissions.includes(permission)
    }

    const handleAction = async (actionFn, actionName, requiresComment = false, requiresDocNumber = false) => {
        if (requiresDocNumber) {
            setShowIssueModal(true)
        } else if (requiresComment) {
            setCurrentAction({ fn: actionFn, name: actionName })
            setShowCommentModal(true)
        } else {
            await executeAction(actionFn, actionName, '')
        }
    }

    const executeAction = async (actionFn, actionName, commentText, docNumber = null) => {
        setIsLoading(true)
        try {
            const payload = { comment: commentText }
            if (docNumber) {
                payload.documentNumber = docNumber
            }
            await actionFn(document.id, payload)
            toast.success(t(`outgoingWorkflow.messages.${actionName}Success`))
            setShowCommentModal(false)
            setShowIssueModal(false)
            setComment('')
            setDocumentNumber('')
            if (onActionComplete) {
                onActionComplete()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t(`outgoingWorkflow.messages.${actionName}Failed`))
        } finally {
            setIsLoading(false)
        }
    }

    const handleCommentSubmit = () => {
        if (currentAction) {
            executeAction(currentAction.fn, currentAction.name, comment)
        }
    }

    const handleIssueSubmit = () => {
        if (!documentNumber.trim()) {
            toast.error(t('outgoingWorkflow.messages.documentNumberRequired'))
            return
        }
        executeAction(issueDocument, 'issue', comment, documentNumber)
    }

    const handleSignScanSubmit = async (e) => {
        e.preventDefault()
        if (!scanFile) {
            toast.error(t('documents.uploadRequirement'))
            return
        }

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('comment', comment)
            formData.append('scanFile', scanFile)
            
            await signDocument(document.id, formData)
            toast.success(t('outgoingWorkflow.messages.signSuccess'))
            setShowSignScanModal(false)
            setComment('')
            setScanFile(null)
            if (onActionComplete) {
                onActionComplete()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('outgoingWorkflow.messages.signFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleReject = async (rejectionReason) => {
        setIsLoading(true)
        try {
            const { workflowStatus } = document
            let rejectFn

            // Stage-based rejection logic for outgoing documents (new flow)
            if (workflowStatus === WORKFLOW_STATUS.DRAFT || workflowStatus === WORKFLOW_STATUS.PENDING_DEPARTMENT_OPINION) {
                // Manager rejects Draft or while waiting for opinions
                rejectFn = rejectContentReview
            } else if (workflowStatus === WORKFLOW_STATUS.UNIT_REVIEWED) {
                // Clerk sends back before scanning (e.g. document needs revision)
                rejectFn = rejectFormatCheck
            } else if (workflowStatus === WORKFLOW_STATUS.SIGNED) {
                // Clerk rejects after format check on scanned document
                rejectFn = rejectFormatCheck
            } else if (workflowStatus === WORKFLOW_STATUS.INCOMING_PENDING) {
                // Director rejects IncomingPending
                rejectFn = rejectIncomingDocument
            }

            if (rejectFn) {
                await rejectFn(document.id, rejectionReason)
                toast.success(t('documents.rejection.rejectSuccess'))
                setShowRejectModal(false)
                if (onActionComplete) {
                    onActionComplete()
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('documents.rejection.rejectFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm(t('documents.confirmDeleteMessage', { title: document.title }))) {
            return
        }
        setIsLoading(true)
        try {
            await deleteDocument(document.id)
            toast.success(t('documents.deleteSuccess'))
            if (onActionComplete) {
                onActionComplete()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('documents.deleteFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    const renderButton = (label, icon, onClick, permission, color = 'primary', skipPermCheck = false) => {
        if (!skipPermCheck && !hasPermission(permission)) return null

        const Icon = icon
        const colorClasses = {
            primary: 'bg-primary-600 hover:bg-primary-700 text-white',
            blue: 'bg-blue-600 hover:bg-blue-700 text-white',
            green: 'bg-green-600 hover:bg-green-700 text-white',
            purple: 'bg-purple-600 hover:bg-purple-700 text-white',
            indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            gray: 'bg-gray-600 hover:bg-gray-700 text-white',
            red: 'bg-red-600 hover:bg-red-700 text-white',
            orange: 'bg-orange-600 hover:bg-orange-700 text-white',
        }

        return (
            <button
                onClick={onClick}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2 ${colorClasses[color]}`}
            >
                <Icon className="w-4 h-4" />
                {label}
            </button>
        )
    }

    const { workflowStatus } = document
    const canEdit = workflowStatus === WORKFLOW_STATUS.DRAFT || userRole === 'ADMIN'
    const canDelete = workflowStatus === WORKFLOW_STATUS.DRAFT || userRole === 'ADMIN'
    const isCreator = document.createdById === user?.id
    const isIncoming = document.category === DOCUMENT_CATEGORY.INCOMING
    const isOwnDepartmentManager = userRole === 'MANAGER' && user?.departmentId === document.departmentId
    const isAdminOrDirector = userRole === 'ADMIN' || userRole === 'DIRECTOR'

    return (
        <>
            <div className="flex flex-col gap-3">
                {/* Main Workflow Actions */}
                <div className="flex flex-wrap gap-2">
                    {/* Draft - Assigned Staff */}
                    {workflowStatus === WORKFLOW_STATUS.PENDING_DRAFT && renderButton(
                        t('outgoingWorkflow.actions.draft'),
                        UploadIcon,
                        onOpenDraft,
                        PERMISSIONS.OUTGOING_DRAFT,
                        'blue'
                    )}

                    {/* Review Content - Manager (Only own department manager or admin) */}
                    {workflowStatus === WORKFLOW_STATUS.DRAFT && (isOwnDepartmentManager || isAdminOrDirector) && (
                        <div className="flex gap-2">
                            {renderButton(
                                'Lấy ý kiến phòng ban',
                                MessageSquare,
                                () => setShowOpinionModal(true),
                                PERMISSIONS.OUTGOING_REVIEW,
                                'orange'
                            )}
                            {renderButton(
                                t('outgoingWorkflow.actions.review'),
                                CheckCircle,
                                () => handleAction(reviewContent, 'review', false),
                                PERMISSIONS.OUTGOING_REVIEW,
                                'blue'
                            )}
                        </div>
                    )}

                    {/* Pending Department Opinions - Own Manager checks results and moves forward or rejects */}
                    {workflowStatus === WORKFLOW_STATUS.PENDING_DEPARTMENT_OPINION && (isOwnDepartmentManager || isAdminOrDirector) && (
                        <div className="flex gap-2">
                            {renderButton(
                                t('outgoingWorkflow.actions.review'),
                                CheckCircle,
                                () => handleAction(reviewContent, 'review', false),
                                PERMISSIONS.OUTGOING_REVIEW,
                                'blue'
                            )}
                            {renderButton(
                                t('documents.rejection.title'),
                                XCircle,
                                () => setShowRejectModal(true),
                                PERMISSIONS.OUTGOING_REVIEW,
                                'red'
                            )}
                        </div>
                    )}

                    {/* Sign - Clerk: Print → Get signed → Scan → Upload */}
                    {workflowStatus === WORKFLOW_STATUS.UNIT_REVIEWED && renderButton(
                        t('outgoingWorkflow.actions.uploadScan'),
                        FileSignature,
                        () => setShowSignScanModal(true),
                        PERMISSIONS.OUTGOING_CHECK_FORMAT,
                        'purple'
                    )}

                    {/* Issue Number after format check - Clerk */}
                    {workflowStatus === WORKFLOW_STATUS.SIGNED && (
                        <div className="flex gap-2">
                            {renderButton(
                                t('outgoingWorkflow.actions.issue'),
                                Hash,
                                () => handleAction(issueDocument, 'issue', false, true),
                                PERMISSIONS.OUTGOING_ISSUE,
                                'indigo'
                            )}
                            {renderButton(
                                t('documents.rejection.rejectFormat'),
                                XCircle,
                                () => setShowRejectModal(true),
                                PERMISSIONS.OUTGOING_CHECK_FORMAT,
                                'red'
                            )}
                        </div>
                    )}

                    {/* Publish - Clerk: opens modal for Internal/External choice */}
                    {workflowStatus === WORKFLOW_STATUS.ISSUED && renderButton(
                        t('outgoingWorkflow.actions.publish'),
                        UploadIcon,
                        () => setShowPublishModal(true),
                        PERMISSIONS.OUTGOING_PUBLISH,
                        'green'
                    )}

                    {/* Archive - Clerk */}
                    {workflowStatus === WORKFLOW_STATUS.SENT && renderButton(
                        t('outgoingWorkflow.actions.archive'),
                        Archive,
                        () => handleAction(archiveDocument, 'archive', false),
                        PERMISSIONS.OUTGOING_ARCHIVE,
                        'gray'
                    )}

                    {/* Incoming Workflow Actions */}
                    {isIncoming && workflowStatus === WORKFLOW_STATUS.INCOMING_PENDING && renderButton(
                        t('common.actions.approve'),
                        CheckCircle,
                        () => handleAction(approveIncomingDocument, 'approve', true),
                        PERMISSIONS.INCOMING_APPROVE,
                        'green'
                    )}

                    {/* Archive Incoming - Clerk */}
                    {isIncoming && workflowStatus === WORKFLOW_STATUS.INCOMING_APPROVED && renderButton(
                        t('outgoingWorkflow.actions.archive') || 'Lưu trữ',
                        Archive,
                        () => handleAction(archiveIncomingDocument, 'archive', false),
                        PERMISSIONS.DOCUMENTS_ARCHIVE,
                        'gray'
                    )}

                    {/* View Processing Instructions - Visible to all assigned after Approval */}
                    {isIncoming && (workflowStatus === WORKFLOW_STATUS.INCOMING_APPROVED || workflowStatus === WORKFLOW_STATUS.ARCHIVED) && (
                        <button
                            onClick={() => setShowPrintModal(true)}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            {t('documents.viewProcessingInstructions') || 'Xem chỉ đạo xử lý'}
                        </button>
                    )}

                    {/* Reject at Draft stage - Manager rejects draft (Only own department manager or admin) */}
                    {!isIncoming && workflowStatus === WORKFLOW_STATUS.DRAFT && (isOwnDepartmentManager || isAdminOrDirector) && hasPermission(PERMISSIONS.OUTGOING_REVIEW) && (
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            {t('documents.rejection.title')}
                        </button>
                    )}

                    {/* Reject at UnitReviewed stage - Clerk sends back before scanning */}
                    {!isIncoming && workflowStatus === WORKFLOW_STATUS.UNIT_REVIEWED && hasPermission(PERMISSIONS.OUTGOING_CHECK_FORMAT) && (
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            {t('documents.rejection.title')}
                        </button>
                    )}

                    {/* Reject Incoming Document */}
                    {isIncoming && workflowStatus === WORKFLOW_STATUS.INCOMING_PENDING && hasPermission(PERMISSIONS.INCOMING_REJECT) && (
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            {t('common.actions.reject')}
                        </button>
                    )}
                </div>

                {/* Edit/Delete Buttons for Draft or Admin */}
                {/* {(canEdit || canDelete) && (isCreator || userRole === 'ADMIN') && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {canEdit && (
                            <button
                                onClick={() => toast.info('Edit functionality - integrate with DocumentEditModal')}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 hover:bg-orange-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                {t('documents.editDocument')}
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t('documents.deleteDocument')}
                            </button>
                        )}
                    </div>
                )} */}

                {/* Rejection Reason Display */}
                {document.rejectionReason && (
                    <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h5 className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
                                    {t('documents.rejection.wasRejected')}
                                </h5>
                                <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                                    {document.rejectionReason}
                                </p>
                                <div className="text-xs text-red-600 dark:text-red-400">
                                    <span className="font-semibold">{t('documents.rejection.rejectedBy')}:</span> {document.rejectedByName || 'N/A'}
                                    <div>
                                        {document.rejectedAt && (
                                            <span>
                                                <span className="font-semibold">{t('documents.rejection.rejectedAt')}:</span> {new Date(document.rejectedAt).toLocaleString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Comment Modal */}
            <Modal
                isOpen={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                title={currentAction?.name === 'approve' && isIncoming
                    ? (t('documents.approval.directorInstructions') || 'Ý kiến chỉ đạo của Ban Giám Đốc')
                    : t('outgoingWorkflow.form.comment')}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('outgoingWorkflow.messages.confirmAction', {
                            action: t(`outgoingWorkflow.actions.${currentAction?.name}`) !== `outgoingWorkflow.actions.${currentAction?.name}`
                                ? t(`outgoingWorkflow.actions.${currentAction?.name}`)
                                : t(`common.actions.${currentAction?.name}`)
                        })}
                    </p>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="form-input w-full"
                        placeholder={t('outgoingWorkflow.form.commentPlaceholder')}
                    />
                </div>
                <div className="flex gap-3 justify-end pt-5 border-t border-gray-100 dark:border-gray-800 mt-5">
                    <button
                        onClick={() => setShowCommentModal(false)}
                        className="btn btn-secondary"
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        onClick={handleCommentSubmit}
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading ? t('common.actions.processing') : t('common.actions.confirm')}
                    </button>
                </div>
            </Modal>

            {/* Issue Document Number Modal */}
            <Modal
                isOpen={showIssueModal}
                onClose={() => setShowIssueModal(false)}
                title={t('outgoingWorkflow.actions.issue')}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('outgoingWorkflow.documentNumber')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={documentNumber}
                            onChange={(e) => setDocumentNumber(e.target.value)}
                            className="form-input w-full"
                            placeholder={t('outgoingWorkflow.form.documentNumberPlaceholder')}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('outgoingWorkflow.form.comment')}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="form-input w-full"
                            placeholder={t('outgoingWorkflow.form.commentPlaceholder')}
                        />
                    </div>
                </div>
                <div className="flex gap-3 justify-end pt-5 border-t border-gray-100 dark:border-gray-800 mt-5">
                    <button
                        onClick={() => setShowIssueModal(false)}
                        className="btn btn-secondary"
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        onClick={handleIssueSubmit}
                        disabled={isLoading || !documentNumber.trim()}
                        className="btn btn-primary"
                    >
                        {isLoading ? t('common.actions.processing') : t('common.actions.confirm')}
                    </button>
                </div>
            </Modal>

            {/* Rejection Modal */}
            <RejectDocumentModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
                documentTitle={document.title}
            />

            {/* Print Processing Form Modal */}
            <DocumentProcessingPreviewModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                document={document}
            />
            {/* Sign Scan Modal */}
            <Modal
                isOpen={showSignScanModal}
                onClose={() => setShowSignScanModal(false)}
                title={t('outgoingWorkflow.actions.sign')}
            >
                <form onSubmit={handleSignScanSubmit} className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('outgoingWorkflow.messages.uploadScanInstruction')}
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('documents.replaceFile')}
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            required
                            onChange={(e) => setScanFile(e.target.files[0])}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('outgoingWorkflow.form.comment')}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="form-textarea w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setShowSignScanModal(false)}
                            className="btn btn-outline"
                        >
                            {t('common.actions.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary"
                        >
                            {isLoading ? t('common.actions.saving') : t('common.actions.confirm')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Publish Document Modal */}
            <PublishDocumentModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                documentId={document.id}
                onSuccess={onActionComplete}
            />

            {/* Department Opinion Modal */}
            <DepartmentOpinionModal
                isOpen={showOpinionModal}
                onClose={() => setShowOpinionModal(false)}
                document={document}
                onSuccess={onActionComplete}
            />
        </>
    )
}

export default WorkflowActionButtons
