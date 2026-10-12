import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    Calendar,
    User,
    Link as LinkIcon,
    Download,
    FileText,
    Shield,
    Tag,
    Share2,
    Clock,
    Building2,
    Briefcase,
    ShieldCheck
} from 'lucide-react'
import DrawerModal from '../common/DrawerModal'
import Badge from '../common/Badge'
import DocumentViewer from './DocumentViewer'
import LoadingSpinner from '../common/LoadingSpinner'
import { fetchDocumentById } from '../../store/documentsSlice'
import { formatDate, formatDocumentType, formatSecurityLevel, formatStatus } from '../../utils/formatters'
import { DOCUMENT_TYPES, SECURITY_LEVELS, PERMISSIONS, ASSIGNMENT_ROLES, DOCUMENT_CATEGORY, WORKFLOW_STATUS } from '../../utils/constants'
import { hasPermission } from '../../utils/permissions'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import WorkflowActionButtons from './WorkflowActionButtons'
import { fetchDocuments } from '../../store/documentsSlice'

const DocumentDetailModal = ({ isOpen, onClose, documentId, onAssign }) => {
    const dispatch = useDispatch()
    const { user } = useAuth()
    const { t } = useTranslation()
    const { currentDocument, loading, error } = useSelector((state) => state.documents)
    const [activeTab, setActiveTab] = useState('preview') // 'preview' or 'info'

    useEffect(() => {
        if (isOpen && documentId) {
            dispatch(fetchDocumentById(documentId))
        }
    }, [isOpen, documentId, dispatch])

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Completed':
            case 'IncomingApproved':
            case 'Sent':
            case 'Archived':
                return 'success'
            case 'InProgress':
                return 'info'
            case 'Rejected':
            case 'IncomingRejected':
                return 'danger'
            case 'Pending':
            case 'IncomingPending':
                return 'warning'
            default: return 'gray'
        }
    }

    if (!documentId) return null

    return (
        <DrawerModal
            isOpen={isOpen}
            onClose={onClose}
            title={t('documents.viewDetail')}
            width="w-full md:w-[85vw] lg:w-[78vw]"
        >
            {loading ? (
                <div className="py-20">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <div className="py-10 text-center text-red-500">{error}</div>
            ) : currentDocument ? (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side: Information (Desktop) / Top (Mobile) */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-800 transition-colors">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary-500" />
                                {t('documents.generalInfo')}
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('common.labels.name')}</label>
                                    <p className="text-gray-900 dark:text-gray-100 font-bold leading-snug">{currentDocument.title}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('documents.documentType')}</label>
                                        <p className="text-gray-900 dark:text-gray-100 font-medium">{formatDocumentType(currentDocument.documentType)}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('documents.documentNumber')}</label>
                                        <p className="text-gray-900 dark:text-gray-100 font-medium">{currentDocument.documentNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('documents.securityLevel')}</label>
                                        <Badge variant={currentDocument.securityLevel === 'Public' ? 'green' : 'red'}>
                                            {formatSecurityLevel(currentDocument.securityLevel)}
                                        </Badge>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('documents.uploadDate')}</label>
                                        <p className="text-gray-900 dark:text-gray-200 flex items-center gap-1.5 text-sm font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                            {formatDate(currentDocument.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {currentDocument.category === DOCUMENT_CATEGORY.INCOMING && currentDocument.issuingAgencyName && (
                            <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-800 transition-colors">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-500" />
                                    {t('documents.issuingAgency')}
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('common.labels.name')}</label>
                                        <p className="text-gray-900 dark:text-gray-100 font-bold leading-snug">{currentDocument.issuingAgencyName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('common.labels.code')}</label>
                                            <p className="text-gray-900 dark:text-gray-100 font-medium">{currentDocument.issuingAgencyCode}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{t('common.labels.type')}</label>
                                            <p className="text-gray-900 dark:text-gray-100 font-medium">{currentDocument.issuingAgencyType}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {currentDocument.category === DOCUMENT_CATEGORY.INCOMING && (
                            <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-800 transition-colors">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-500" />
                                    {t('documents.assignments')}
                                </h4>
                                {currentDocument.assignments?.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Group assignments: Parents first, then children nested */}
                                        {(() => {
                                            const allAssignments = currentDocument.assignments;
                                            const parents = allAssignments.filter(a => !a.parentAssignmentId);
                                            // Some might be children but parent not in list (e.g. filtered view)
                                            const orphans = allAssignments.filter(a => a.parentAssignmentId && !parents.some(p => p.id === a.parentAssignmentId));

                                            const renderAssignment = (assign, isChild = false) => (
                                                <div key={assign.id || idx} className={`${isChild ? 'ml-6 mt-2 bg-gray-50/50 dark:bg-gray-800/30' : 'bg-white dark:bg-gray-800 shadow-sm'} p-3 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {isChild && <User className="w-3 h-3 text-gray-400" />}
                                                            <span className={`font-bold text-sm ${isChild ? 'text-gray-700 dark:text-gray-300' : 'text-blue-700 dark:text-blue-400'}`}>
                                                                {assign.assignedToName || assign.departmentName || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <Badge variant={assign.role === 'Main' ? 'blue' : 'gray'} className="text-[10px] px-1.5 py-0">
                                                            {assign.role === 'Main' ? t('documents.assignmentRoles.main') : t('documents.assignmentRoles.support')}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant={getStatusVariant(assign.status)} size="sm">
                                                            {formatStatus(assign.status)}
                                                        </Badge>
                                                        {assign.deadline && (
                                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDate(assign.deadline)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <>
                                                    {parents.map(parent => (
                                                        <div key={parent.id} className="space-y-1">
                                                            {renderAssignment(parent)}
                                                            {allAssignments.filter(a => a.parentAssignmentId === parent.id).map(child => renderAssignment(child, true))}
                                                        </div>
                                                    ))}
                                                    {orphans.map(orphan => renderAssignment(orphan))}
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">{t('documents.noAssignmentsMessage')}</p>
                                )}
                            </section>
                        )}

                        <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-800 transition-colors">

                            {/* Workflow Actions for BGĐ / Manager OR for assigned users to see instructions */}
                            {(hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN) ||
                                (currentDocument.category === DOCUMENT_CATEGORY.INCOMING &&
                                    (currentDocument.workflowStatus === WORKFLOW_STATUS.INCOMING_APPROVED || currentDocument.workflowStatus === WORKFLOW_STATUS.ARCHIVED) &&
                                    currentDocument.assignments?.some(a => a.assignedToUserId === user?.id || (a.departmentId && user?.departmentId === a.departmentId)))) && (
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                                            {t('documents.workflow.actions')}
                                        </h4>
                                        <WorkflowActionButtons
                                            document={currentDocument}
                                            onActionComplete={() => {
                                                dispatch(fetchDocumentById(currentDocument.id))
                                                dispatch(fetchDocuments()) // Refresh list in background
                                            }}
                                        />
                                    </div>
                                )}

                            {onAssign && currentDocument.category === DOCUMENT_CATEGORY.INCOMING && (currentDocument.workflowStatus === WORKFLOW_STATUS.INCOMING_APPROVED || currentDocument.workflowStatus === WORKFLOW_STATUS.ARCHIVED) && (
                                <button
                                    onClick={() => onAssign(currentDocument)}
                                    className="w-full mt-4 btn btn-secondary flex items-center justify-center gap-2 text-sm py-2 dark:bg-gray-800 dark:hover:bg-gray-750"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>{t('documents.assignNow')}</span>
                                </button>
                            )}
                        </section>

                        {currentDocument.description && (
                            <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200/50 dark:border-gray-800 transition-colors">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-orange-500" />
                                    {t('documents.contentSummary')}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {currentDocument.description}
                                </p>
                            </section>
                        )}
                    </div>

                    {/* Right side: Preview */}
                    <div className="w-full lg:w-2/3 h-[850px] lg:h-auto overflow-hidden">
                        <DocumentViewer
                            documentId={currentDocument.id}
                            fileName={currentDocument.fileName}
                        />
                    </div>
                </div>
            ) : null}
        </DrawerModal>
    )
}

export default DocumentDetailModal
