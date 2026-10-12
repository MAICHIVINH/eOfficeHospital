import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, Filter, Download, Eye, Edit, Trash2, Share2, Upload, FileText, X, Archive } from 'lucide-react'
import { fetchDocuments } from '../store/documentsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import { formatDate, formatTime, formatFileSize, formatDocumentType, formatSecurityLevel, isOverdue } from '../utils/formatters'
import { STATUS_COLORS, PERMISSIONS, DOCUMENT_CATEGORY, WORKFLOW_STATUS, DOCUMENT_TYPES, DOCUMENT_TYPE_ENUM } from '../utils/constants'
import { hasPermission } from '../utils/permissions'
import { useAuth } from '../hooks/useAuth'
import DocumentUploadModal from '../components/documents/DocumentUploadModal'
import DocumentDetailModal from '../components/documents/DocumentDetailModal'
import DocumentAssignModal from '../components/documents/DocumentAssignModal'
import DocumentEditModal from '../components/documents/DocumentEditModal'
import DocumentTypeTree from '../components/documents/DocumentTypeTree'
import ConfirmModal from '../components/common/ConfirmModal'
import { downloadDocument, updateDocument, deleteDocument, getDocuments, exportIncomingToExcel } from '../api/documentsApi'
import { archiveDocument as archiveIncoming } from '../api/incomingWorkflowApi'
import { archiveDocument as archiveOutgoing } from '../api/outgoingWorkflowApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { exportToRegistryBook } from '../utils/excelExport'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'
import { getIssuingAgencies } from '../api/issuingAgenciesApi'

const DocumentsPage = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { id } = useParams()
    const { user } = useAuth()
    const { documents, loading, pagination, filters } = useSelector((state) => state.documents)

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [selectedSecurityLevel, setSelectedSecurityLevel] = useState('')
    const [selectedAgency, setSelectedAgency] = useState('')
    const [agencies, setAgencies] = useState([])

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState(null)
    const { t } = useTranslation()

    // Default params for this page
    const defaultParams = { category: DOCUMENT_CATEGORY.INCOMING }

    useEffect(() => {
        dispatch(fetchDocuments(defaultParams))
        fetchAgencies()
    }, [dispatch])

    const fetchAgencies = async () => {
        try {
            const data = await getIssuingAgencies()
            setAgencies(data)
        } catch (error) {
            console.error('Failed to fetch agencies:', error)
        }
    }


    useEffect(() => {
        if (id) {
            setSelectedDoc({ id })
            setIsDetailModalOpen(true)
        }
    }, [id])

    const handleSearch = (e) => {
        e.preventDefault()
        dispatch(fetchDocuments({
            ...defaultParams,
            search: searchTerm,
            documentType: selectedType || undefined,
            securityLevel: selectedSecurityLevel || undefined,
            issuingAgencyId: selectedAgency || undefined
        }))
    }

    const handleAgencyFilter = (agencyId) => {
        setSelectedAgency(agencyId)
        dispatch(fetchDocuments({
            ...defaultParams,
            search: searchTerm,
            documentType: selectedType || undefined,
            securityLevel: selectedSecurityLevel || undefined,
            issuingAgencyId: agencyId || undefined
        }))
    }

    const handleTypeFilter = (type) => {
        setSelectedType(type)
        dispatch(fetchDocuments({
            ...defaultParams,
            search: searchTerm,
            documentType: type || undefined,
            securityLevel: selectedSecurityLevel || undefined
        }))
    }

    const handleSecurityLevelFilter = (level) => {
        setSelectedSecurityLevel(level)
        dispatch(fetchDocuments({
            ...defaultParams,
            search: searchTerm,
            documentType: selectedType || undefined,
            securityLevel: level || undefined
        }))
    }

    const handleClearFilters = () => {
        setSearchTerm('')
        setSelectedType('')
        setSelectedSecurityLevel('')
        setSelectedAgency('')
        dispatch(fetchDocuments(defaultParams))
    }

    const handlePageChange = (pageNumber) => {
        dispatch(fetchDocuments({
            ...defaultParams,
            pageNumber,
            search: searchTerm,
            documentType: selectedType || undefined,
            securityLevel: selectedSecurityLevel || undefined,
            issuingAgencyId: selectedAgency || undefined
        }))
    }

    const handlePageSizeChange = (pageSize) => {
        dispatch(fetchDocuments({
            ...defaultParams,
            page: 1,
            pageSize,
            search: searchTerm,
            documentType: selectedType || undefined,
            securityLevel: selectedSecurityLevel || undefined,
            issuingAgencyId: selectedAgency || undefined
        }))
    }

    const handleViewDetail = (doc) => {
        setSelectedDoc(doc)
        setIsDetailModalOpen(true)
    }

    const handleAssign = (doc) => {
        setSelectedDoc(doc)
        setIsAssignModalOpen(true)
    }

    const handleDownload = async (doc) => {
        try {
            const { url } = await downloadDocument(doc.id)
            if (url) {
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', doc.fileName || `document_${doc.id}.pdf`)
                document.body.appendChild(link)
                link.click()
                link.parentNode.removeChild(link)
            } else {
                throw new Error('No download URL provided')
            }
        } catch (err) {
            console.error('Download error:', err)
            toast.error(t('documents.downloadFailed'))
        }
    }

    const handleEdit = (doc) => {
        setSelectedDoc(doc)
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = async (formData, file = null) => {
        try {
            await updateDocument(selectedDoc.id, formData, file)
            toast.success(t('documents.updateSuccess'))
            dispatch(fetchDocuments(defaultParams))
        } catch (err) {
            console.error('Update error:', err)
            toast.error(t('documents.updateFailed'))
        }
    }

    const handleDelete = (doc) => {
        setSelectedDoc(doc)
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        try {
            await deleteDocument(selectedDoc.id)
            toast.success(t('documents.deleteSuccess'))
            dispatch(fetchDocuments(defaultParams))
        } catch (err) {
            console.error('Delete error:', err)
            toast.error(t('documents.deleteFailed'))
        }
    }

    const handleArchive = async (doc) => {
        try {
            toast.loading(t('documents.archiving') || 'Đang lưu trữ...')
            if (doc.category === DOCUMENT_CATEGORY.INCOMING) {
                await archiveIncoming(doc.id, { comment: 'Lưu trữ văn bản đến' })
            } else {
                await archiveOutgoing(doc.id, { comment: 'Lưu trữ văn bản đi' })
            }
            toast.dismiss()
            toast.success(t('documents.archiveSuccess') || 'Đã lưu trữ văn bản thành công')
            handleRefresh()
        } catch (err) {
            console.error('Archive error:', err)
            toast.dismiss()
            toast.error(t('documents.archiveFailed') || 'Lưu trữ thất bại')
        }
    }

    const handleRefresh = () => {
        dispatch(fetchDocuments({
            ...defaultParams,
            search: searchTerm,
            documentType: selectedType || undefined,
            securityLevel: selectedSecurityLevel || undefined,
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize
        }))
    }



    const handleExportRegistryBook = async () => {
        try {
            toast.loading(t('documents.exporting'))

            // Use the professional backend export that supports styling (Times New Roman, colors, etc.)
            const blob = await exportIncomingToExcel({
                search: searchTerm,
                documentType: selectedType || undefined,
                securityLevel: selectedSecurityLevel || undefined,
            })

            const url = window.URL.createObjectURL(new Blob([blob]))
            const link = document.createElement('a')
            link.href = url
            const timestamp = new Date().toISOString().split('T')[0]
            link.setAttribute('download', `So_VanBanDen_${timestamp}.xlsx`)
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

    const columnDefs = useMemo(() => [
        {
            headerName: t('documents.documentName'),
            field: 'title',
            minWidth: 400,
            cellRenderer: (params) => {
                const doc = params.data;
                return (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-900/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                                <FileText size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate leading-tight">
                                {doc.name || doc.title}
                            </span>
                            <span className="text-[11px] mt-1 text-gray-400 dark:text-gray-600 font-medium truncate leading-tight">
                                ID: {doc.id}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            headerName: t('documents.documentType'),
            field: 'documentType',
            width: 100,
            cellRenderer: (params) => (
                <span className="inline-flex items-center px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide dark:text-slate-300">
                    {formatDocumentType(params.value)}
                </span>
            )
        },
        {
            headerName: t('documents.issuingAgency'),
            field: 'issuingAgencyName',
            width: 180,
            cellRenderer: (params) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-gray-100 font-bold text-sm leading-tight">
                        {params.value || 'N/A'}
                    </span>
                    {params.data.issuingAgencyCode && (
                        <span className="text-[10px] text-gray-500 font-medium">
                            {params.data.issuingAgencyCode}
                        </span>
                    )}
                </div>
            )
        },
        {
            headerName: t('documents.securityLevel'),
            field: 'securityLevel',
            width: 100,
            cellRenderer: (params) => (
                <span className={`inline-flex items-center px-3 rounded-lg text-[11px] font-black uppercase tracking-wide border shadow-md transition-all duration-300 group-hover:scale-105 ${params.value === 'Confidential'
                    ? 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/40 dark:to-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 shadow-rose-500/10'
                    : params.value === 'Internal'
                        ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-amber-500/10'
                        : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-emerald-500/10'
                    }`}>
                    {formatSecurityLevel(params.value)}
                </span>
            )
        },
        {
            headerName: t('common.labels.createdBy'),
            field: 'createdByName',
            width: 180,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-xs border border-primary-200 dark:border-primary-800">
                        {(params.value || 'N/A').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
                        {params.value || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            headerName: t('common.labels.createdAt'),
            field: 'createdAt',
            width: 100,
            cellRenderer: (params) => (
                <div className="flex flex-col">
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold truncate leading-tight">
                        {formatDate(params.value)}
                    </span>
                    <span className="text-[11px] mt-1 text-gray-400 dark:text-gray-600 font-medium truncate leading-tight">
                        {formatTime(params.value)}
                    </span>
                </div>
            )
        },
        {
            headerName: t('documents.processingDeadline') || 'Hạn xử lý',
            field: 'processingDeadline',
            width: 100,
            cellRenderer: (params) => {
                if (!params.value) return <span className="text-gray-400">-</span>;
                const docIsOverdue = isOverdue(params.value);
                return (
                    <div className="flex flex-col">
                        <span className={`text-sm font-semibold truncate leading-tight ${docIsOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatDate(params.value)}
                        </span>
                        {docIsOverdue && (
                            <span className="text-[10px] mt-1 text-red-500 font-black font-medium truncate leading-tight">
                                {t('documents.overdue') || 'QUÁ HẠN'}
                            </span>
                        )}
                    </div>
                );
            }
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
                        label: t('documents.downloadDocument'),
                        icon: <Download size={16} strokeWidth={2.5} />,
                        onClick: () => handleDownload(doc),
                        iconColor: 'text-gray-600 dark:text-gray-400'
                    },
                    {
                        label: t('documents.assignDocument'),
                        icon: <Share2 size={16} className="rotate-180" strokeWidth={2.5} />,
                        onClick: () => handleAssign(doc),
                        hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN),
                        disabled: doc.category === DOCUMENT_CATEGORY.INCOMING &&
                            doc.workflowStatus !== WORKFLOW_STATUS.INCOMING_APPROVED &&
                            doc.workflowStatus !== WORKFLOW_STATUS.ARCHIVED,
                        title: doc.category === DOCUMENT_CATEGORY.INCOMING &&
                            doc.workflowStatus !== WORKFLOW_STATUS.INCOMING_APPROVED &&
                            doc.workflowStatus !== WORKFLOW_STATUS.ARCHIVED
                            ? t('documents.messages.waitForApprovalToAssign') || 'Chờ duyệt để phân công'
                            : t('documents.assignDocument'),
                        iconColor: 'text-emerald-600 dark:text-emerald-400'
                    },
                    {
                        label: t('documents.editDocument'),
                        icon: <Edit size={16} strokeWidth={2.5} />,
                        onClick: () => handleEdit(doc),
                        hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_EDIT),
                        iconColor: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                        label: t('documents.deleteDocument'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDelete(doc),
                        hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_DELETE),
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t, user, hasPermission]);

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
                                <button
                                    type="submit"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors"
                                >
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
                                {t('documents.securityLevel')}
                            </label>
                            <select
                                value={selectedSecurityLevel}
                                onChange={(e) => handleSecurityLevelFilter(e.target.value)}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            >
                                <option value="">{t('common.labels.all')}</option>
                                <option value="Public">{t('formatters.securityLevel.PUBLIC')}</option>
                                <option value="Internal">{t('formatters.securityLevel.INTERNAL')}</option>
                                <option value="Confidential">{t('formatters.securityLevel.CONFIDENTIAL')}</option>
                            </select>
                        </div>

                        {/* Issuing Agency Filter */}
                        <div className="w-full md:w-56">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('documents.issuingAgency')}
                            </label>
                            <select
                                value={selectedAgency}
                                onChange={(e) => handleAgencyFilter(e.target.value)}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            >
                                <option value="">{t('common.labels.all')}</option>
                                {agencies.map((agency) => (
                                    <option key={agency.id} value={agency.id}>
                                        {agency.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full md:w-56">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('documents.documentType')}
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => handleTypeFilter(e.target.value)}
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

                        <div className="flex-1 flex justify-end gap-3 w-full md:w-auto pb-1">

                            <button
                                type="button"
                                onClick={handleExportRegistryBook}
                                className="btn bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center gap-2 shadow-lg shadow-blue-600/20"
                                title={t('documents.exportRegistryBookIncoming') || 'Xuất sổ văn bản đến'}
                            >
                                <FileText className="w-5 h-5" />
                                <span>{t('documents.exportRegistryBookIncoming') || 'Sổ VB Đến'}</span>
                            </button>
                            {hasPermission(user, PERMISSIONS.DOCUMENTS_CREATE) && (
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary-600/20"
                                >
                                    <Upload className="w-5 h-5 shadow-sm" />
                                    <span>{t('documents.uploadDocument')}</span>
                                </button>
                            )}
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
                                <div className="py-12">
                                    <LoadingSpinner />
                                </div>
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
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{doc.name || doc.title}</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                {formatDocumentType(doc.documentType)}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${doc.securityLevel === 'Confidential' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                                                                : doc.securityLevel === 'Internal' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                                }`}>
                                                                {formatSecurityLevel(doc.securityLevel)}
                                                            </span>
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
                                                            label: t('documents.downloadDocument'),
                                                            icon: <Download size={16} strokeWidth={2.5} />,
                                                            onClick: () => handleDownload(doc),
                                                            iconColor: 'text-gray-600 dark:text-gray-400'
                                                        },
                                                        {
                                                            label: t('documents.assignDocument'),
                                                            icon: <Share2 size={16} className="rotate-180" strokeWidth={2.5} />,
                                                            onClick: () => handleAssign(doc),
                                                            hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN),
                                                            disabled: doc.category === DOCUMENT_CATEGORY.INCOMING &&
                                                                doc.workflowStatus !== WORKFLOW_STATUS.INCOMING_APPROVED &&
                                                                doc.workflowStatus !== WORKFLOW_STATUS.ARCHIVED,
                                                            iconColor: 'text-emerald-600 dark:text-emerald-400'
                                                        },
                                                        {
                                                            label: t('documents.editDocument'),
                                                            icon: <Edit size={16} strokeWidth={2.5} />,
                                                            onClick: () => handleEdit(doc),
                                                            hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_EDIT),
                                                            iconColor: 'text-amber-600 dark:text-amber-400'
                                                        },
                                                        {
                                                            label: t('documents.deleteDocument'),
                                                            icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                            onClick: () => handleDelete(doc),
                                                            hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_DELETE),
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
                                            currentPage={pagination.pageNumber}
                                            totalPages={pagination.totalPages}
                                            pageSize={pagination.pageSize}
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

            <DocumentUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleRefresh}
            />

            <DocumentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false)
                    setSelectedDoc(null)
                    if (id) navigate('/documents')
                }}
                documentId={selectedDoc?.id}
                onAssign={hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN) ? handleAssign : null}
            />

            <DocumentAssignModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false)
                    setSelectedDoc(null)
                }}
                document={selectedDoc}
            />

            <DocumentEditModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setSelectedDoc(null)
                }}
                document={selectedDoc}
                onSave={handleSaveEdit}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false)
                    setSelectedDoc(null)
                }}
                onConfirm={handleConfirmDelete}
                title={t('documents.confirmDelete')}
                message={t('documents.confirmDeleteMessage', { title: selectedDoc?.title || selectedDoc?.name })}
                confirmText={t('common.actions.delete')}
                cancelText={t('common.actions.cancel')}
                type="danger"
            />
        </div>
    )
}

export default DocumentsPage
