import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Search, ShieldPlus, Edit, Trash2, ShieldCheck, Filter, Eye } from 'lucide-react'
import { fetchRoles, removeRole } from '../store/rolesSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import ConfirmModal from '../components/common/ConfirmModal'
import RoleFormModal from '../components/roles/RoleFormModal'
import RoleDetailModal from '../components/roles/RoleDetailModal'
import { useAuth } from '../hooks/useAuth'
import { hasPermission } from '../utils/permissions'
import { PERMISSIONS, ROLES } from '../utils/constants'
import toast from 'react-hot-toast'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'

const RolesPage = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useAuth()
    const roles = useSelector((state) => state.roles.items)
    const loading = useSelector((state) => state.roles.loading)
    const pagination = useSelector((state) => state.roles.pagination)

    const [searchTerm, setSearchTerm] = useState('')
    const [pageNumber, setPageNumber] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [showFilters, setShowFilters] = useState(false)

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState(null)
    const [formModalOpen, setFormModalOpen] = useState(false)
    const [formMode, setFormMode] = useState('create')
    const [selectedRole, setSelectedRole] = useState(null)
    const [roleDetailModalOpen, setRoleDetailModalOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchRoles({ pageNumber, pageSize, search: searchTerm }))
    }, [dispatch, pageNumber, pageSize])

    const handleSearch = (e) => {
        e.preventDefault()
        setPageNumber(1)
        dispatch(fetchRoles({ pageNumber: 1, pageSize, search: searchTerm }))
    }

    const handlePageChange = (page) => {
        setPageNumber(page)
    }

    const handlePageSizeChange = (size) => {
        setPageSize(size)
        setPageNumber(1)
    }

    const handleDeleteClick = (role) => {
        if (role.code === ROLES.ADMIN) {
            toast.error(t('roles.messages.cannotDeleteAdmin'))
            return
        }
        setRoleToDelete(role)
        setDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (roleToDelete) {
            try {
                await dispatch(removeRole(roleToDelete.id)).unwrap()
                toast.success(t('roles.messages.deleteSuccess'))
            } catch (error) {
                toast.error(error || t('roles.messages.deleteFailed'))
            } finally {
                setRoleToDelete(null)
                setDeleteModalOpen(false)
            }
        }
    }

    const handleCreateClick = () => {
        setFormMode('create')
        setSelectedRole(null)
        setFormModalOpen(true)
    }

    const handleEditClick = (role) => {
        setFormMode('edit')
        setSelectedRole(role)
        setFormModalOpen(true)
    }

    const handleViewClick = (role) => {
        setSelectedRole(role)
        setRoleDetailModalOpen(true)
    }

    const handleFormClose = () => {
        setFormModalOpen(false)
        setSelectedRole(null)
    }

    const getRoleBadgeVariant = (code) => {
        switch (code) {
            case ROLES.ADMIN: return 'red'
            case ROLES.DIRECTOR: return 'purple'
            case ROLES.CLERK: return 'cyan'
            case ROLES.MANAGER: return 'blue'
            case ROLES.STAFF: return 'green'
            default: return 'gray'
        }
    }

    const columnDefs = useMemo(() => [
        {
            headerName: t('roles.labels.name'),
            field: 'name',
            minWidth: 250,
            flex: 2,
            cellRenderer: (params) => {
                const role = params.data;
                return (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-900/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                                <ShieldCheck size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate leading-tight">
                                {t(`formatters.role.${role.code}`, { defaultValue: role.name })}
                            </span>
                            <span className="text-[11px] mt-1 text-gray-400 dark:text-gray-600 font-medium truncate leading-tight">{role.code}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            headerName: t('roles.labels.code'),
            field: 'code',
            cellRenderer: (params) => (
                <div className="transform transition-all duration-300 group-hover:scale-105">
                    <Badge variant={getRoleBadgeVariant(params.value)}>
                        {params.value}
                    </Badge>
                </div>
            )
        },
        {
            headerName: t('roles.labels.description'),
            field: 'description',
            cellRenderer: (params) => (
                <span className="text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate block">
                    {params.value || '-'}
                </span>
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
                const role = params.data;
                const actions = [
                    {
                        label: t('common.actions.view'),
                        icon: <Eye size={16} strokeWidth={2.5} />,
                        onClick: () => handleViewClick(role),
                        iconColor: 'text-primary-600 dark:text-primary-400'
                    },
                    {
                        label: t('common.actions.edit'),
                        icon: <Edit size={16} strokeWidth={2.5} />,
                        onClick: () => handleEditClick(role),
                        hidden: !hasPermission(user, PERMISSIONS.ROLES_EDIT),
                        iconColor: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                        label: t('common.actions.delete'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDeleteClick(role),
                        hidden: !hasPermission(user, PERMISSIONS.ROLES_DELETE) || role.code === ROLES.ADMIN,
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t, user, hasPermission]);

    return (
        <div>
            {/* Search Bar */}
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
                                    placeholder={t('roles.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex justify-end gap-3 w-full md:w-auto pb-1">
                            {hasPermission(user, PERMISSIONS.ROLES_CREATE) && (
                                <button
                                    type="button"
                                    onClick={handleCreateClick}
                                    className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary-600/20"
                                >
                                    <ShieldPlus className="w-5 h-5 shadow-sm" />
                                    <span>{t('roles.addRole')}</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Roles Table */}
            <div className="card overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-12">
                            <LoadingSpinner />
                        </div>
                    ) : roles.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                <ShieldPlus className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('roles.noRoles')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {roles.map((role) => (
                                    <div key={role.id} className="p-4 bg-white dark:bg-gray-900">
                                        <div className="flex items-start gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-lg border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                                                <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t(`formatters.role.${role.code}`, { defaultValue: role.name })}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Badge variant={getRoleBadgeVariant(role.code)}>{role.code}</Badge>
                                                </div>
                                                {role.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{role.description}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <button
                                                onClick={() => handleViewClick(role)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white transition-all mr-3"
                                            >
                                                <Eye size={13} /> {t('common.actions.view')}
                                            </button>

                                            <ActionMenu actions={[
                                                {
                                                    label: t('common.actions.view'),
                                                    icon: <Eye size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleViewClick(role),
                                                    iconColor: 'text-primary-600 dark:text-primary-400'
                                                },
                                                {
                                                    label: t('common.actions.edit'),
                                                    icon: <Edit size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleEditClick(role),
                                                    hidden: !hasPermission(user, PERMISSIONS.ROLES_EDIT),
                                                    iconColor: 'text-amber-600 dark:text-amber-400'
                                                },
                                                {
                                                    label: t('common.actions.delete'),
                                                    icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleDeleteClick(role),
                                                    hidden: !hasPermission(user, PERMISSIONS.ROLES_DELETE) || role.code === ROLES.ADMIN,
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
                                    rowData={roles}
                                    columnDefs={columnDefs}
                                    onRowClicked={(params) => handleViewClick(params.data)}
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

            {/* Modals */}
            <RoleFormModal
                isOpen={formModalOpen}
                onClose={handleFormClose}
                role={selectedRole}
                mode={formMode}
            />

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={t('roles.confirmDelete')}
                message={t('roles.confirmDeleteMessage', { name: roleToDelete?.name })}
                confirmText={t('common.actions.delete')}
                cancelText={t('common.actions.cancel')}
                type="danger"
            />

            <RoleDetailModal
                isOpen={roleDetailModalOpen}
                onClose={() => setRoleDetailModalOpen(false)}
                role={selectedRole}
            />
        </div>
    )
}

export default RolesPage
