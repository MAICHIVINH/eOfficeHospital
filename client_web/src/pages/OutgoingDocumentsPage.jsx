import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, Eye, Plus, FileText, Edit, Trash2 } from 'lucide-react'
import { getDocuments, getDocumentById, updateDocument, deleteDocument, exportOutgoingToExcel } from '../api/documentsApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import WorkflowStatusBadge from '../components/documents/WorkflowStatusBadge'
import { formatDate, formatTime, formatDocumentType } from '../utils/formatters'
import { DOCUMENT_CATEGORY, WORKFLOW_STATUS, PERMISSIONS, DOCUMENT_TYPES, DOCUMENT_TYPE_ENUM } from '../utils/constants'
import { hasPermission } from '../utils/permissions'
import { useAuth } from '../hooks/useAuth'
import OutgoingDocumentForm from '../components/documents/OutgoingDocumentForm'
import OutgoingDocumentDetailModal from '../components/documents/OutgoingDocumentDetailModal'
import DocumentEditModal from '../components/documents/DocumentEditModal'
import DocumentTypeTree from '../components/documents/DocumentTypeTree'
import OutgoingAssignModal from '../components/documents/OutgoingAssignModal'
import ConfirmModal from '../components/common/ConfirmModal'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { exportToRegistryBook } from '../utils/excelExport'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'

const OutgoingDocumentsPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const { user } = useAuth()
    const { t } = useTranslation()

    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [pageNumber, setPageNumber] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedDocId, setSelectedDocId] = useState(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedEditDoc, setSelectedEditDoc] = useState(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [docToDelete, setDocToDelete] = useState(null)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

    const fetchOutgoingDocuments = async () => {
        setLoading(true)
        try {
            const response = await getDocuments({
                category: DOCUMENT_CATEGORY.OUTGOING,
                pageNumber,
                pageSize,
                search: searchTerm,
                documentType: typeFilter || undefined,
                workflowStatus: statusFilter || undefined,
            })
            setDocuments(response.items)
            setTotalCount(response.totalCount)
        } catch (error) {
            console.error('Failed to fetch outgoing documents:', error)
            toast.error(t('common.messages.loadFailed'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOutgoingDocuments()
        if (id) {
            setSelectedDocId(id)
            setIsDetailModalOpen(true)
        }
    }, [pageNumber, pageSize, id, typeFilter, statusFilter])

    const handleSearch = (e) => {
        e.preventDefault()
        setPageNumber(1)
        fetchOutgoingDocuments()
    }

    const handlePageChange = (newPage) => setPageNumber(newPage)
    const handlePageSizeChange = (newPageSize) => { setPageSize(newPageSize); setPageNumber(1) }
    const handleViewDetail = (doc) => { setSelectedDocId(doc.id); setIsDetailModalOpen(true) }
    const handleCreateSuccess = () => fetchOutgoingDocuments()

    const handleEdit = async (doc, e) => {
        e.stopPropagation()
        try {
            const fullDoc = await getDocumentById(doc.id)
            setSelectedEditDoc(fullDoc)
            setIsEditModalOpen(true)
        } catch (error) {
            toast.error(t('common.messages.loadFailed'))
        }
    }

    const handleEditSave = async (formData, file) => {
        try {
            await updateDocument(selectedEditDoc.id, formData, file)
            toast.success(t('documents.updateSuccess'))
            setIsEditModalOpen(false)
            setSelectedEditDoc(null)
            fetchOutgoingDocuments()
        } catch (error) {
            toast.error(error.response?.data?.message || t('documents.updateFailed'))
            throw error
        }
    }

    const handleDelete = (doc, e) => { e.stopPropagation(); setDocToDelete(doc); setIsDeleteModalOpen(true) }

    const handleConfirmDelete = async () => {
        if (!docToDelete) return
        try {
            await deleteDocument(docToDelete.id)
            toast.success(t('documents.deleteSuccess'))
            fetchOutgoingDocuments()
        } catch (error) {
            toast.error(error.response?.data?.message || t('documents.deleteFailed'))
        } finally {
            setIsDeleteModalOpen(false)
            setDocToDelete(null)
        }
    }



    const handleExportRegistryBook = async () => {
        try {
            toast.loading(t('documents.exporting'))

            // Use the professional backend export that supports styling (Times New Roman, colors, etc.)
            const blob = await exportOutgoingToExcel({
                search: searchTerm,
                documentType: typeFilter || undefined,
            })

            const url = window.URL.createObjectURL(new Blob([blob]))
            const link = document.createElement('a')
            link.href = url
            const timestamp = new Date().toISOString().split('T')[0]
            link.setAttribute('download', `So_VanBanDi_${timestamp}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.dismiss()
            toast.success(t('documents.exportSuccess'))
        } catch (err) {
            console.error('Export error:', err)
            toast.dismiss()
            toast.error(t('documents.exportFailed'))
        }
    }

    const canEditDelete = (doc) => {
        const hasEditGlobal = hasPermission(user, PERMISSIONS.DOCUMENTS_EDIT)
        const hasDeleteGlobal = hasPermission(user, PERMISSIONS.DOCUMENTS_DELETE)
        if (hasEditGlobal && hasDeleteGlobal) return true
        const isDraft = doc.workflowStatus === WORKFLOW_STATUS.DRAFT
        const isCreator = doc.createdById === user?.id
        const hasDraftPermission = hasPermission(user, PERMISSIONS.OUTGOING_DRAFT)
        return isDraft && isCreator && (hasDraftPermission || hasEditGlobal || hasDeleteGlobal)
    }

    // Frontend filtering removed as it is now handled by the backend API

    const columnDefs = useMemo(() => [
        {
            headerName: t('documents.documentName'),
            field: 'title',
            minWidth: 400,
            cellRenderer: (params) => {
                const doc = params.data;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-all duration-300">
                            <FileText size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col mt-3">
                            <span className="font-bold text-gray-900 truncate leading-tight dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">{doc.title}</span>
                            <span className="text-[11px] text-gray-400 mt-1 truncate leading-tight dark:text-gray-600 font-medium">ID: {doc.id}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            headerName: t('outgoingWorkflow.documentNumber'),
            field: 'documentNumber',
            cellRenderer: (params) => (
                <span className="inline-flex items-center px-3 rounded-lg text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-sm">
                    {params.value || t('outgoingWorkflow.notIssued')}
                </span>
            )
        },
        {
            headerName: t('documents.documentType'),
            field: 'documentType',
            cellRenderer: (params) => (
                <span className="inline-flex items-center px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide dark:text-slate-300">
                    {formatDocumentType(params.value)}
                </span>
            )
        },
        {
            headerName: t('outgoingWorkflow.currentStatus'),
            field: 'workflowStatus',
            cellRenderer: (params) => (
                <div className="transform transition-all duration-300 group-hover:scale-105">
                    <WorkflowStatusBadge status={params.value} />
                </div>
            )
        },
        {
            headerName: t('common.labels.createdBy'),
            field: 'createdByName',
            cellRenderer: (params) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xs border border-primary-200 dark:border-primary-800">
                        {(params.value || 'N/A').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">{params.value || 'N/A'}</span>
                </div>
            )
        },
        {
            headerName: t('common.labels.createdAt'),
            field: 'createdAt',
            cellRenderer: (params) => (
                <div className="flex flex-col">
                    <span className="text-gray-700 truncate leading-tight dark:text-gray-300 text-sm font-semibold">{formatDate(params.value)}</span>
                    <span className="text-[10px] truncate leading-tight mt-1 text-gray-400 dark:text-gray-600 font-medium uppercase tracking-wide">
                        {formatTime(params.value)}
                    </span>
                </div>
            )
        },
        {
            headerName: t('common.labels.actions'),
            field: 'actions',
            width: 70,
            flex: 0.5,
            cellClass: 'flex justify-center',
            headerClass: 'text-center',
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const doc = params.data;
                const actions = [
                    {
                        label: t('documents.viewDetail'),
                        icon: <Eye size={16} strokeWidth={2.5} />,
                        onClick: () => handleViewDetail(doc),
                        iconColor: 'text-blue-600 dark:text-blue-400'
                    },
                    {
                        label: t('documents.editDocument'),
                        icon: <Edit size={16} strokeWidth={2.5} />,
                        onClick: () => handleEdit(doc, { stopPropagation: () => { } }), // Mock event
                        hidden: !canEditDelete(doc),
                        iconColor: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                        label: t('documents.deleteDocument'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDelete(doc, { stopPropagation: () => { } }), // Mock event
                        hidden: !canEditDelete(doc),
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t, user, hasPermission, canEditDelete]);

    return (
        <div>
            {/* Filters */}
            <div className="card mb-3">
                <div className="card-body p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-80">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('common.actions.search')}
                            </label>
                            <div className="relative group w-full">
                                <button type="submit" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors">
                                    <Search className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    placeholder={t('documents.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('common.labels.status')}
                            </label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all">
                                <option value="">{t('common.labels.all')}</option>
                                {Object.entries(WORKFLOW_STATUS)
                                    .filter(([key]) => !key.startsWith('INCOMING_'))
                                    .map(([key, value]) => (
                                        <option key={key} value={value}>{t(`outgoingWorkflow.status.${value}`)}</option>
                                    ))}
                            </select>
                        </div>

                        <div className="w-full md:w-56">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('documents.documentType')}
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPageNumber(1) }}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            >
                                <option value="">{t('common.labels.all')}</option>
                                {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                                    <option key={key} value={DOCUMENT_TYPE_ENUM[key]}>
                                        {t(`formatters.documentType.${key}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 flex justify-end gap-3 w-full md:w-auto">

                             <button type="button" onClick={handleExportRegistryBook} className="btn bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center gap-2 shadow-lg shadow-blue-600/20" title={t('documents.exportRegistryBookOutgoing') || 'Xuất sổ văn bản đi'}>
                                <FileText className="w-5 h-5" />
                                <span className="hidden sm:inline">{t('documents.exportRegistryBookOutgoing') || 'Sổ VB Đi'}</span>
                            </button>
                            {hasPermission(user, PERMISSIONS.OUTGOING_ASSIGN) && (
                                <button type="button" onClick={() => setIsAssignModalOpen(true)} className="btn bg-amber-500 hover:bg-amber-600 text-white border-none flex items-center gap-2 shadow-lg shadow-amber-600/20 whitespace-nowrap">
                                    <Plus className="w-5 h-5 shadow-sm" />
                                    <span>{t('outgoingWorkflow.assignModal.assignTitle')}</span>
                                </button>
                            )}
                            <button type="button" onClick={() => setIsFormOpen(true)} className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary-600/20 whitespace-nowrap">
                                <Plus className="w-5 h-5 shadow-sm" />
                                <span>{t('outgoingWorkflow.createDraft')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-col gap-6">
                {/* Right Documents List */}
                <div className="flex-1 min-w-0">
                    <div className="card overflow-hidden">
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="py-12"><LoadingSpinner /></div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                        <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('documents.noDocuments')}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile card view */}
                                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="p-4 bg-white dark:bg-gray-900">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                                                        <FileText size={18} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{doc.title}</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                                {doc.documentNumber || t('outgoingWorkflow.notIssued')}
                                                            </span>
                                                            <WorkflowStatusBadge status={doc.workflowStatus} />
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{doc.createdByName} • {formatDate(doc.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                                                    <button
                                                        onClick={() => handleViewDetail(doc)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white transition-all mr-3"
                                                    >
                                                        <Eye size={14} />{t('documents.viewDetail')}
                                                    </button>

                                                    <ActionMenu actions={[
                                                        {
                                                            label: t('documents.viewDetail'),
                                                            icon: <Eye size={16} strokeWidth={2.5} />,
                                                            onClick: () => handleViewDetail(doc),
                                                            iconColor: 'text-blue-600 dark:text-blue-400'
                                                        },
                                                        {
                                                            label: t('documents.editDocument'),
                                                            icon: <Edit size={16} strokeWidth={2.5} />,
                                                            onClick: () => handleEdit(doc, { stopPropagation: () => { } }),
                                                            hidden: !canEditDelete(doc),
                                                            iconColor: 'text-amber-600 dark:text-amber-400'
                                                        },
                                                        {
                                                            label: t('documents.deleteDocument'),
                                                            icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                            onClick: () => handleDelete(doc, { stopPropagation: () => { } }),
                                                            hidden: !canEditDelete(doc),
                                                            iconColor: 'text-rose-600 dark:text-rose-400'
                                                        }
                                                    ]} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop table view */}
                                    <div className="hidden md:block">
                                        <Table
                                            rowData={documents}
                                            columnDefs={columnDefs}
                                            onRowClicked={(params) => handleViewDetail(params.data)}
                                            // Integrated pagination props
                                            pagination={true}
                                            currentPage={pageNumber}
                                            totalPages={Math.ceil(totalCount / pageSize)}
                                            pageSize={pageSize}
                                            onPageChange={handlePageChange}
                                            onPageSizeChange={handlePageSizeChange}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <OutgoingDocumentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={handleCreateSuccess} />
            <OutgoingDocumentDetailModal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedDocId(null) }} documentId={selectedDocId} onActionComplete={fetchOutgoingDocuments} />
            <DocumentEditModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedEditDoc(null) }} document={selectedEditDoc} onSave={handleEditSave} />
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDocToDelete(null) }} onConfirm={handleConfirmDelete} title={t('documents.confirmDelete')} message={t('documents.confirmDeleteMessage', { title: docToDelete?.title })} confirmText={t('common.actions.delete')} cancelText={t('common.actions.cancel')} type="danger" />
            <OutgoingAssignModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onSuccess={fetchOutgoingDocuments} />
        </div>
    )
}

export default OutgoingDocumentsPage
