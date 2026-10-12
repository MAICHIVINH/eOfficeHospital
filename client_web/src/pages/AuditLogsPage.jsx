import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
    History,
    Search,
    Filter,
    Calendar,
    User as UserIcon,
    Info,
    Download,
    RefreshCw,
    Trash2
} from 'lucide-react'
import {
    fetchAuditLogs,
    selectAuditLogs,
    selectAuditPagination,
    selectAuditFilters,
    selectAuditLoading,
    setFilters,
    setPage,
    setPageSize,
    clearFilters,
    deleteAuditLog
} from '../store/auditLogsSlice'
import { fetchUsers, selectAllUsers } from '../store/usersSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import ConfirmModal from '../components/common/ConfirmModal'
import { formatDate, formatDateTime } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'
import Table from '../components/common/Table'
import { isAdmin } from '../utils/permissions'
import { toast } from 'react-hot-toast'
import ActionMenu from '../components/common/ActionMenu'

const getAuditActionLabels = (t) => ({
    'Login': t('auditLogs.actions_labels.Login'),
    'Logout': t('auditLogs.actions_labels.Logout'),
    'Upload': t('auditLogs.actions_labels.Upload'),
    'View': t('auditLogs.actions_labels.View'),
    'Download': t('auditLogs.actions_labels.Download'),
    'Share': t('auditLogs.actions_labels.Share'),
    'Assign': t('auditLogs.actions_labels.Assign'),
    'UpdateStatus': t('auditLogs.actions_labels.UpdateStatus'),
    'Delete': t('auditLogs.actions_labels.Delete'),
    'CreateUser': t('auditLogs.actions_labels.CreateUser'),
    'UpdateUser': t('auditLogs.actions_labels.UpdateUser'),
    'DeleteUser': t('auditLogs.actions_labels.DeleteUser'),
    'ChangePassword': t('auditLogs.actions_labels.ChangePassword'),
    'CreateDepartment': t('auditLogs.actions_labels.CreateDepartment'),
    'UpdateDepartment': t('auditLogs.actions_labels.UpdateDepartment'),
    'DeleteDepartment': t('auditLogs.actions_labels.DeleteDepartment'),
    'CreateRole': t('auditLogs.actions_labels.CreateRole'),
    'UpdateRole': t('auditLogs.actions_labels.UpdateRole'),
    'DeleteRole': t('auditLogs.actions_labels.DeleteRole'),
    'AssignPermissions': t('auditLogs.actions_labels.AssignPermissions'),
    'CreatePermission': t('auditLogs.actions_labels.CreatePermission'),
    'UpdatePermission': t('auditLogs.actions_labels.UpdatePermission'),
    'DeletePermission': t('auditLogs.actions_labels.DeletePermission'),
    'DeleteAssignment': t('auditLogs.actions_labels.DeleteAssignment')
})

const ACTION_COLORS = {
    'Login': 'success',
    'Logout': 'gray',
    'Upload': 'info',
    'Delete': 'danger',
    'DeleteUser': 'danger',
    'DeleteDepartment': 'danger',
    'UpdateStatus': 'warning',
    'Assign': 'primary'
}

const AuditLogsPage = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useAuth()
    const AUDIT_ACTION_LABELS = getAuditActionLabels(t)

    const logs = useSelector(selectAuditLogs)
    const pagination = useSelector(selectAuditPagination)
    const filters = useSelector(selectAuditFilters)
    const loading = useSelector(selectAuditLoading)
    const users = useSelector(selectAllUsers)

    const [selectedLog, setSelectedLog] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null) // log to delete
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchAuditLogs({
            page: pagination.page,
            pageSize: pagination.pageSize,
            ...filters
        }))
        dispatch(fetchUsers())
    }, [dispatch, pagination.page, pagination.pageSize, JSON.stringify(filters)])

    const handleFilterChange = (field, value) => {
        dispatch(setFilters({ [field]: value }))
    }

    const handlePageChange = (page) => {
        dispatch(setPage(page))
    }

    const handlePageSizeChange = (pageSize) => {
        dispatch(setPageSize(pageSize))
    }

    const handleRefresh = () => {
        dispatch(fetchAuditLogs({
            page: pagination.page,
            pageSize: pagination.pageSize,
            ...filters
        }))
    }

    const handleClearFilters = () => {
        dispatch(clearFilters())
    }

    const handleDeleteLog = (e, log) => {
        e.stopPropagation()
        setDeleteTarget(log)
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return
        try {
            await dispatch(deleteAuditLog(deleteTarget.id)).unwrap()
            toast.success(t('common.messages.deleteSuccess'))
        } catch (error) {
            toast.error(error || t('common.messages.deleteFailed'))
        } finally {
            setIsDeleteModalOpen(false)
            setDeleteTarget(null)
        }
    }

    const columnDefs = useMemo(() => [
        {
            headerName: t('auditLogs.time'),
            field: 'timestamp',
            cellRenderer: (params) => (
                <span className="font-mono text-[11px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {formatDateTime(params.value)}
                </span>
            )
        },
        {
            headerName: t('auditLogs.user'),
            field: 'userFullName',
            cellRenderer: (params) => (
                <div className="flex flex-col">
                    <span className="font-black text-gray-900 dark:text-gray-100 text-sm truncate leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {params.value}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1 dark:text-gray-500 font-black truncate leading-tight tracking-widest">
                        @{params.data.username}
                    </span>
                </div>
            )
        },
        {
            headerName: t('auditLogs.action'),
            field: 'action',
            cellRenderer: (params) => (
                <div className="transform transition-all duration-300 group-hover:scale-105">
                    <Badge variant={ACTION_COLORS[params.value] || 'info'}>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {AUDIT_ACTION_LABELS[params.value] || params.value}
                        </span>
                    </Badge>
                </div>
            )
        },
        {
            headerName: t('auditLogs.details'),
            field: 'details',
            flex: 2,
            cellRenderer: (params) => (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate block" title={params.value}>
                    {params.value}
                </span>
            )
        },
        {
            headerName: t('auditLogs.ipDevice'),
            field: 'ipAddress',
            cellRenderer: (params) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 truncate leading-tight">
                        IP: {params.value}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1 dark:text-gray-600 font-medium italic truncate leading-tight max-w-[150px]" title={params.data.userAgent}>
                        {params.data.userAgent}
                    </span>
                </div>
            )
        },
        {
            headerName: t('auditLogs.actions'),
            field: 'actions',
            width: 70,
            flex: 0.5,
            cellClass: 'flex justify-center',
            headerClass: 'text-center',
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const actions = [
                    {
                        label: t('auditLogs.detailsLookup'),
                        icon: <Info size={16} strokeWidth={2.5} />,
                        onClick: () => setSelectedLog(params.data),
                        iconColor: 'text-blue-600 dark:text-blue-400'
                    },
                    {
                        label: t('common.actions.delete'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDeleteLog({ stopPropagation: () => { } }, params.data),
                        hidden: !isAdmin(user),
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t, AUDIT_ACTION_LABELS, user]);

    return (
        <div className="space-y-5">
            {/* <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-5"> */}
            {/* <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                        {t('auditLogs.title')}
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                        {t('auditLogs.subtitle')}
                    </p>
                </div> */}
            {/* <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="btn btn-secondary border-none bg-gray-100 dark:bg-gray-800 flex items-center gap-2 py-2 h-[38px] px-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={t('auditLogs.syncData')}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''} text-gray-500`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t('auditLogs.sync')}</span>
                    </button>
                </div> */}
            {/* </div> */}

            {/* Filter Bar */}
            <div className="mb-3">
                <div className="card shadow-sm bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
                    <div className="card-body p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full md:w-48 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">{t('auditLogs.individual')}</label>
                                <select
                                    className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                    value={filters.userId}
                                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                                >
                                    <option value="">{t('auditLogs.allStaff')}</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-48 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">{t('auditLogs.behavior')}</label>
                                <select
                                    className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                >
                                    <option value="">{t('auditLogs.allActions')}</option>
                                    {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full md:w-48 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">{t('auditLogs.fromDate')}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="form-input w-full pl-9 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                        value={filters.fromDate}
                                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-48 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">{t('auditLogs.toDate')}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="form-input w-full pl-9 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                        value={filters.toDate}
                                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 flex justify-end w-full md:w-auto">
                                <button
                                    onClick={handleRefresh}
                                    className="btn btn-secondary border-none bg-gray-100 dark:bg-gray-800 flex items-center gap-2 py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    title={t('auditLogs.syncData')}
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''} text-gray-500`} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">{t('auditLogs.sync')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-12">
                            <LoadingSpinner />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                <History className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('auditLogs.noLogs')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-4 bg-white dark:bg-gray-900 overflow-hidden">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex-shrink-0">
                                                <History size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-black text-gray-900 dark:text-gray-100 text-sm tracking-tight">{log.userFullName}</p>
                                                    <span className="text-[10px] text-gray-400 font-mono">{formatDateTime(log.timestamp)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant={ACTION_COLORS[log.action] || 'info'}>
                                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                                            {AUDIT_ACTION_LABELS[log.action] || log.action}
                                                        </span>
                                                    </Badge>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">@{log.username}</span>
                                                </div>
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2 italic">
                                                    {log.details}
                                                </p>
                                                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">IP: {log.ipAddress}</span>
                                                    
                                                    <ActionMenu actions={[
                                                        {
                                                            label: t('auditLogs.detailsLookup'),
                                                            icon: <Info size={16} strokeWidth={2.5} />,
                                                            onClick: () => setSelectedLog(log),
                                                            iconColor: 'text-blue-600 dark:text-blue-400'
                                                        },
                                                        {
                                                            label: t('common.actions.delete'),
                                                            icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                            onClick: () => handleDeleteLog({ stopPropagation: () => { } }, log),
                                                            hidden: !isAdmin(user),
                                                            iconColor: 'text-rose-600 dark:text-rose-400'
                                                        }
                                                    ]} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table view */}
                            <div className="hidden md:block">
                                <Table
                                    rowData={logs}
                                    columnDefs={columnDefs}
                                    onRowClicked={(params) => setSelectedLog(params.data)}
                                    // Integrated pagination props
                                    pagination={true}
                                    currentPage={pagination.page}
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

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-800">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                {t('auditLogs.activityDetail')}
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{t('auditLogs.time')}</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono italic">{formatDateTime(selectedLog.timestamp)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{t('auditLogs.action')}</p>
                                    <Badge variant={ACTION_COLORS[selectedLog.action] || 'info'}>
                                        {AUDIT_ACTION_LABELS[selectedLog.action] || selectedLog.action}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{t('auditLogs.performer')}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{selectedLog.userFullName}</p>
                                    <p className="text-xs text-gray-500 font-mono">@{selectedLog.username}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{t('auditLogs.ipAddress')}</p>
                                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit">{selectedLog.ipAddress}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{t('auditLogs.details')}</p>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-sm italic text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {selectedLog.details}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{t('auditLogs.deviceBrowser')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 break-all bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl font-mono border border-gray-100 dark:border-gray-800">
                                    {selectedLog.userAgent}
                                </p>
                            </div>
                            {selectedLog.documentTitle && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('auditLogs.relatedDocument')}</p>
                                    <p className="text-sm font-medium text-blue-600">{selectedLog.documentTitle}</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50/50 dark:bg-gray-800/30">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="btn btn-primary px-10 shadow-lg shadow-primary-600/20"
                            >
                                {t('auditLogs.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
                onConfirm={handleConfirmDelete}
                title={t('auditLogs.confirmDeleteTitle') || 'Xóa nhật ký'}
                message={t('auditLogs.confirmDeleteMessage') || 'Bạn có chắc muốn xóa nhật ký này? Hành động này không thể hoàn tác.'}
                confirmText={t('common.actions.delete')}
                cancelText={t('common.actions.cancel')}
                type="danger"
            />
        </div>
    )
}

export default AuditLogsPage
