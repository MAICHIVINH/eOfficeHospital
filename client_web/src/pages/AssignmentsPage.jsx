import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { FileText, Filter, RefreshCw, CheckCircle, Clock, XCircle, Download, Eye, Edit, Trash2, Search } from 'lucide-react'
import {
    fetchAllAssignments,
    fetchMyDepartmentAssignments,
    selectAllAssignments,
    selectMyDepartmentAssignments,
    selectAssignmentsLoading,
    setFilters,
    clearFilters,
    removeAssignment,
} from '../store/assignmentsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import UpdateAssignmentStatusModal from '../components/assignments/UpdateAssignmentStatusModal'
import AssignmentDetailModal from '../components/assignments/AssignmentDetailModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { formatDate, isOverdue } from '../utils/formatters'
import { STATUS_COLORS, PERMISSIONS, ROLES } from '../utils/constants'
import { hasPermission } from '../utils/permissions'
import { useAuth } from '../hooks/useAuth'
import assignmentsApi from '../api/assignmentsApi'
import toast from 'react-hot-toast'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'

const AssignmentsPage = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useAuth()
    const isAdmin = user?.role === ROLES.ADMIN
    const canAssign = hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN)
    // Default tab: admin -> 'all', others -> 'my-department'
    const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'my-department')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [assignmentToDelete, setAssignmentToDelete] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState('')

    const rawMyAssignments = useSelector(selectMyDepartmentAssignments)
    const allAssignments = useSelector(selectAllAssignments)
    const loading = useSelector(selectAssignmentsLoading)

    // Derive per-tab data from the fetched lists
    const assignments = useMemo(() => {
        if (activeTab === 'all') return allAssignments
        if (activeTab === 'created-by-me') return allAssignments  // filtered server-side to AssignedById == userId
        if (activeTab === 'individual') return rawMyAssignments.filter(a => a.assignedToUserId === user?.id)
        // 'my-department': department-level assignments (no specific user)
        return rawMyAssignments.filter(a => !a.assignedToUserId)
    }, [activeTab, allAssignments, rawMyAssignments])

    useEffect(() => {
        if (activeTab === 'my-department' || activeTab === 'individual') {
            dispatch(fetchMyDepartmentAssignments())
        } else {
            // 'all' (admin) and 'created-by-me' both use allAssignments
            dispatch(fetchAllAssignments())
        }
        setCurrentPage(1) // Reset to first page when tab changes
    }, [dispatch, activeTab])

    useEffect(() => {
        setCurrentPage(1) // Reset to first page when filters change
    }, [selectedStatus, searchTerm])

    const handleStatusFilter = (status) => {
        setSelectedStatus(status)
        dispatch(setFilters({ status }))
    }

    const handleClearFilters = () => {
        setSelectedStatus('')
        setSearchTerm('')
        dispatch(clearFilters())
    }

    const handleViewDetails = (assignment) => {
        setSelectedAssignment(assignment)
        setDetailModalOpen(true)
    }

    const handleUpdateStatus = (assignment) => {
        setSelectedAssignment(assignment)
        setStatusModalOpen(true)
    }

    const handleRefresh = () => {
        if (activeTab === 'my-department' || activeTab === 'individual') {
            dispatch(fetchMyDepartmentAssignments())
        } else {
            dispatch(fetchAllAssignments())
        }
    }

    const handleDeleteClick = (assignment) => {
        setAssignmentToDelete(assignment)
        setDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!assignmentToDelete) return

        try {
            await dispatch(removeAssignment(assignmentToDelete.id)).unwrap()
            toast.success(t('common.messages.deleteSuccess'))
            setDeleteModalOpen(false)
            setAssignmentToDelete(null)
        } catch (error) {
            toast.error(error || t('common.messages.deleteFailed'))
        }
    }

    const handleDownloadReport = async (assignmentId, fileName) => {
        try {
            const response = await assignmentsApi.getReportFileUrl(assignmentId)
            // Open in new tab
            window.open(response.url, '_blank')
            toast.success(t('assignments.downloadReportSuccess'))
        } catch (error) {
            toast.error(error.response?.data?.message || t('assignments.downloadReportFailed'))
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'InProgress':
                return <Clock className="w-4 h-4 text-blue-500" />
            case 'Rejected':
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-yellow-500" />
        }
    }

    const getStatusText = (status) => {
        const statusMap = {
            'Pending': t('assignments.pending'),
            'InProgress': t('assignments.inProgress'),
            'Completed': t('assignments.completed'),
            'Rejected': t('assignments.rejected')
        }
        return statusMap[status] || status
    }

    // Calculate pagination totals for the new Table component
    const totalPages = Math.ceil(assignments.length / pageSize)

    // Sliced data for client-side pagination
    const paginatedAssignments = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return assignments.slice(startIndex, startIndex + pageSize)
    }, [assignments, currentPage, pageSize])

    const columnDefs = useMemo(() => {
        const baseDefs = [
            {
                headerName: t('assignments.document'),
                field: 'documentTitle',
                flex: 2,
                cellRenderer: (params) => (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-lg border border-blue-200 dark:border-blue-800 group-hover:scale-110 transition-all duration-300">
                            <FileText size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {params.value}
                        </span>
                    </div>
                )
            }
        ];

        // Show "Assign To" column in admin's 'all' tab and in 'created-by-me' tab
        if (activeTab === 'all' || activeTab === 'created-by-me') {
            baseDefs.push({
                headerName: t('assignments.assignTo'),
                field: 'assignedToUserName',
                cellRenderer: (params) => (
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                        {params.value || params.data.departmentName || 'N/A'}
                    </span>
                )
            });
        }

        baseDefs.push(
            {
                headerName: t('assignments.role'),
                field: 'assignedRole',
                flex: 0.75,
                cellRenderer: (params) => (
                    <div className="transform transition-all duration-300 group-hover:scale-105">
                        <span className={`inline-flex items-center px-3 text-[10px] font-black uppercase tracking-wider ${params.value === 'Main'
                            ? 'text-primary-700 dark:text-primary-400'
                            : 'text-slate-700 dark:text-slate-400'
                            }`}>
                            {params.value === 'Main' ? t('assignments.mainRole') : t('assignments.supportRole')}
                        </span>
                    </div>
                )
            },
            {
                headerName: t('assignments.status'),
                field: 'status',
                cellRenderer: (params) => (
                    <div className="transform transition-all duration-300 group-hover:scale-105">
                        <Badge variant={STATUS_COLORS[params.value] || 'gray'}>
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                {getStatusText(params.value)}
                            </span>
                        </Badge>
                    </div>
                )
            },
            {
                headerName: t('assignments.assignedBy'),
                field: 'assignedByName',
                cellRenderer: (params) => (
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                        {params.value}
                    </span>
                )
            },
            {
                headerName: t('assignments.assignedDate'),
                field: 'assignedAt',
                width: 120,
                cellRenderer: (params) => (
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">
                        {formatDate(params.value)}
                    </span>
                )
            },
            {
                headerName: t('assignments.deadline') || 'Hạn xử lý',
                field: 'deadline',
                width: 140,
                cellRenderer: (params) => {
                    if (!params.value) return <span className="text-gray-400">-</span>;
                    const assignmentIsOverdue = isOverdue(params.value) && params.data.status !== 'Completed';
                    return (
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold ${assignmentIsOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {formatDate(params.value)}
                            </span>
                            {assignmentIsOverdue && (
                                <span className="text-[10px] text-red-500 font-black uppercase tracking-tighter animate-pulse">
                                    {t('documents.overdue') || 'QUÁ HẠN'}
                                </span>
                            )}
                        </div>
                    );
                }
            },
            {
                headerName: t('assignments.reportFile'),
                field: 'reportFileName',
                cellRenderer: (params) => (
                    params.value ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadReport(params.data.id, params.value); }}
                            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all hover:scale-105"
                            title={params.value}
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-xs font-medium truncate max-w-[120px]">{params.value}</span>
                        </button>
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )
                )
            },
            {
                headerName: t('assignments.actions'),
                field: 'actions',
                width: 70,
                flex: 0.5,
                cellClass: 'flex justify-center',
                headerClass: 'text-center',
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    const assignment = params.data;
                    const actions = [
                        {
                            label: t('assignments.viewDetails'),
                            icon: <Eye size={16} strokeWidth={2.5} />,
                            onClick: () => handleViewDetails(assignment),
                            iconColor: 'text-blue-600 dark:text-blue-400'
                        },
                        {
                            label: t('common.actions.edit'),
                            icon: <Edit size={16} strokeWidth={2.5} />,
                            onClick: () => handleUpdateStatus(assignment),
                            iconColor: 'text-amber-600 dark:text-amber-400'
                        },
                        {
                            label: t('common.actions.delete'),
                            icon: <Trash2 size={16} strokeWidth={2.5} />,
                            onClick: () => handleDeleteClick(assignment),
                            hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN),
                            iconColor: 'text-rose-600 dark:text-rose-400'
                        }
                    ];
                    return <ActionMenu actions={actions} />;
                }
            }
        );

        return baseDefs;
    }, [t, activeTab, user, hasPermission]);

    return (
        <div>
            {/* Page header */}
            {/* <div className="mb-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t('assignments.title')}</h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                    {t('assignments.subtitle')}
                </p>
            </div> */}

            {/* Tabs */}
            <div className="mb-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-end">
                <nav className="-mb-px flex space-x-8">
                    {/* Tab 1: All system (Admin only) */}
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`py-5 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                                activeTab === 'all'
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4" />
                                <span>{t('assignments.allSystem')}</span>
                            </div>
                        </button>
                    )}

                    {/* Tab: My Department (all non-admin roles) */}
                    <button
                        onClick={() => setActiveTab('my-department')}
                        className={`py-5 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                            activeTab === 'my-department'
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4" />
                            <span>{t('assignments.myDepartment')}</span>
                        </div>
                    </button>

                    {/* Tab: Individually assigned to me */}
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={`py-5 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                            activeTab === 'individual'
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4" />
                            <span>{t('assignments.assignedToMe')}</span>
                        </div>
                    </button>

                    {/* Tab: Assignments I created (visible to those who can assign) */}
                    {canAssign && (
                        <button
                            onClick={() => setActiveTab('created-by-me')}
                            className={`py-5 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                                activeTab === 'created-by-me'
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4" />
                                <span>{t('assignments.createdByMe')}</span>
                            </div>
                        </button>
                    )}
                </nav>
            </div>

            {/* Filters */}
            <div className="card mb-3">
                <div className="card-body p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-80">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('common.actions.search')}
                            </label>
                            <div className="relative group w-full">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('documents.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        dispatch(setFilters({ searchTerm: e.target.value }))
                                    }}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-wrap items-end justify-end gap-2">
                            <div className="flex items-center gap-2 mr-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('assignments.filterStatus')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: '', label: t('assignments.allStatus') },
                                    { value: 'Pending', label: t('assignments.pending'), color: 'bg-amber-500' },
                                    { value: 'InProgress', label: t('assignments.inProgress'), color: 'bg-primary-600' },
                                    { value: 'Completed', label: t('assignments.completed'), color: 'bg-emerald-600' }
                                ].map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() => handleStatusFilter(filter.value)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedStatus === filter.value
                                            ? `${filter.color || 'bg-primary-600'} text-white shadow-lg shadow-gray-200 dark:shadow-none`
                                            : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignments table */}
            <div className="card overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-12">
                            <LoadingSpinner />
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('assignments.noAssignments')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedAssignments.map((assignment) => (
                                    <div key={assignment.id} className="p-4 bg-white dark:bg-gray-900">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                                                <FileText size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{assignment.documentTitle}</p>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    <Badge variant={STATUS_COLORS[assignment.status] || 'gray'}>
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                            {getStatusText(assignment.status)}
                                                        </span>
                                                    </Badge>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${assignment.assignedRole === 'Main'
                                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                                                        : 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                                        }`}>
                                                        {assignment.assignedRole === 'Main' ? t('assignments.mainRole') : t('assignments.supportRole')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('assignments.assignedBy')}: {assignment.assignedByName} • {formatDate(assignment.assignedAt)}</p>
                                                {(activeTab === 'all' || activeTab === 'created-by-me') && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('assignments.assignTo')}: {assignment.assignedToUserName || assignment.departmentName || 'N/A'}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <button
                                                onClick={() => handleViewDetails(assignment)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white transition-all mr-3"
                                            >
                                                <Eye size={14} />{t('assignments.viewDetails')}
                                            </button>

                                            <ActionMenu actions={[
                                                {
                                                    label: t('assignments.viewDetails'),
                                                    icon: <Eye size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleViewDetails(assignment),
                                                    iconColor: 'text-blue-600 dark:text-blue-400'
                                                },
                                                {
                                                    label: t('common.actions.edit'),
                                                    icon: <Edit size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleUpdateStatus(assignment),
                                                    iconColor: 'text-amber-600 dark:text-amber-400'
                                                },
                                                {
                                                    label: t('common.actions.delete'),
                                                    icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleDeleteClick(assignment),
                                                    hidden: !hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN),
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
                                    rowData={paginatedAssignments}
                                    columnDefs={columnDefs}
                                    onRowClicked={(params) => handleViewDetails(params.data)}
                                    // Integrated pagination props
                                    pagination={true}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <AssignmentDetailModal
                isOpen={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false)
                    setSelectedAssignment(null)
                }}
                assignment={selectedAssignment}
            />

            {/* Update Status Modal */}
            <UpdateAssignmentStatusModal
                isOpen={statusModalOpen}
                onClose={() => {
                    setStatusModalOpen(false)
                    setSelectedAssignment(null)
                    handleRefresh()
                }}
                assignment={selectedAssignment}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    setAssignmentToDelete(null)
                }}
                onConfirm={handleConfirmDelete}
                title={t('common.messages.confirmDelete')}
                message={t('documents.confirmDeleteMessage', { title: assignmentToDelete?.documentTitle })}
                type="danger"
            />
        </div >
    )
}

export default AssignmentsPage
