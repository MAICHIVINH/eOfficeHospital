import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Search, UserPlus, Edit, Trash2, Key, Filter, Eye } from 'lucide-react'
import {
    fetchUsers,
    deleteUser,
    selectFilteredUsers,
    selectUsersLoading,
    selectUsersPagination,
    setFilters,
    clearFilters,
    setPage,
    setPageSize,
    selectUsersFilters,
} from '../store/usersSlice'
import { fetchDepartments, selectAllDepartments } from '../store/departmentsSlice'
import { fetchRoles, selectAllRoles } from '../store/rolesSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import ConfirmModal from '../components/common/ConfirmModal'
import UserFormModal from '../components/users/UserFormModal'
import ChangePasswordModal from '../components/users/ChangePasswordModal'
import UserDetailModal from '../components/users/UserDetailModal'
import { ROLES, PERMISSIONS } from '../utils/constants'
import { hasPermission } from '../utils/permissions'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'

const UsersPage = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useAuth()
    const users = useSelector(selectFilteredUsers)
    const loading = useSelector(selectUsersLoading)
    const pagination = useSelector(selectUsersPagination)
    const departments = useSelector(selectAllDepartments)
    const roles = useSelector(selectAllRoles)
    const filters = useSelector(selectUsersFilters)

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedDepartment, setSelectedDepartment] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [formModalOpen, setFormModalOpen] = useState(false)
    const [formMode, setFormMode] = useState('create')
    const [selectedUser, setSelectedUser] = useState(null)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [userForPassword, setUserForPassword] = useState(null)
    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchUsers({
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            ...filters
        }))
        dispatch(fetchDepartments({ pageSize: 100 }))
        dispatch(fetchRoles({ pageSize: 100 }))
    }, [dispatch, pagination.pageNumber, pagination.pageSize, JSON.stringify(filters)])

    const handleSearch = (e) => {
        e.preventDefault()
        dispatch(setFilters({ search: searchTerm }))
    }

    const handleRoleFilter = (role) => {
        setSelectedRole(role)
        dispatch(setFilters({ role }))
    }

    const handleDepartmentFilter = (deptId) => {
        setSelectedDepartment(deptId)
        dispatch(setFilters({ departmentId: deptId }))
    }

    const handleStatusFilter = (status) => {
        setSelectedStatus(status)
        const isActive = status === '' ? null : status === 'active'
        dispatch(setFilters({ isActive }))
    }

    const handleClearFilters = () => {
        setSearchTerm('')
        setSelectedRole('')
        setSelectedDepartment('')
        setSelectedStatus('')
        dispatch(clearFilters())
    }

    const handleDeleteClick = (user) => {
        setUserToDelete(user)
        setDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (userToDelete) {
            await dispatch(deleteUser(userToDelete.id))
            setUserToDelete(null)
        }
    }

    const handleCreateClick = () => {
        setFormMode('create')
        setSelectedUser(null)
        setFormModalOpen(true)
    }

    const handleEditClick = (user) => {
        setFormMode('edit')
        setSelectedUser(user)
        setFormModalOpen(true)
    }

    const handlePasswordClick = (user) => {
        setUserForPassword(user)
        setPasswordModalOpen(true)
    }

    const handleViewClick = (user) => {
        setSelectedUser(user)
        setUserDetailModalOpen(true)
    }

    const handleFormClose = () => {
        setFormModalOpen(false)
        const isCreate = formMode === 'create'
        setSelectedUser(null)

        // Reset to page 1 if creating, otherwise stay on current page
        const targetPage = isCreate ? 1 : pagination.pageNumber
        if (isCreate) {
            dispatch(setPage(1))
        }

        dispatch(fetchUsers({
            pageNumber: targetPage,
            pageSize: pagination.pageSize,
            ...filters
        }))
    }

    const handlePasswordClose = () => {
        setPasswordModalOpen(false)
        setUserForPassword(null)
    }

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case ROLES.ADMIN:
                return 'red'
            case ROLES.DIRECTOR:
                return 'purple'
            case ROLES.CLERK:
                return 'cyan'
            case ROLES.MANAGER:
                return 'blue'
            case ROLES.STAFF:
                return 'green'
            default:
                return 'gray'
        }
    }

    const handleExportExcel = () => {
        toast.info(t('common.messages.featureComingSoon'))
    }

    const columnDefs = useMemo(() => [
        {
            headerName: 'Avatar',
            field: 'avatar',
            flex: 0.5,
            width: 80,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center text-primary-700 dark:text-primary-400 font-extrabold text-base uppercase shadow-lg border border-primary-200 dark:border-primary-800 group-hover:scale-110 transition-all duration-300">
                    {params.data.fullName?.charAt(0) || params.data.username?.charAt(0)}
                </div>
            )
        },
        {
            headerName: t('users.username'),
            field: 'username',
            cellRenderer: (params) => (
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight">
                    {params.value}
                </span>
            )
        },
        {
            headerName: t('users.fullName'),
            field: 'fullName',
            cellRenderer: (params) => (
                <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">{params.value}</span>
            )
        },
        {
            headerName: t('users.email'),
            field: 'email',
            cellRenderer: (params) => (
                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{params.value}</span>
            )
        },
        {
            headerName: t('users.role'),
            field: 'role',
            flex: 0.75,
            cellRenderer: (params) => (
                <div className="transform transition-all duration-300 group-hover:scale-105">
                    <Badge variant={getRoleBadgeVariant(params.value)}>{params.value}</Badge>
                </div>
            )
        },
        {
            headerName: t('common.labels.department'),
            field: 'department.name',
            flex: 1,
            cellRenderer: (params) => (
                <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">{params.value || '-'}</span>
            )
        },
        {
            headerName: t('users.status'),
            field: 'isActive',
            flex: 0.75,
            cellRenderer: (params) => (
                <div className="transform transition-all duration-300 group-hover:scale-105">
                    <Badge variant={params.value ? 'green' : 'gray'}>
                        <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${params.value ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                            {params.value ? t('users.ready') : t('users.absent')}
                        </span>
                    </Badge>
                </div>
            )
        },
        {
            headerName: t('users.actions'),
            field: 'actions',
            width: 70,
            flex: 0.5,
            cellClass: 'flex justify-center',
            headerClass: 'text-center',
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const u = params.data;
                const actions = [
                    {
                        label: t('common.actions.view'),
                        icon: <Eye size={16} strokeWidth={2.5} />,
                        onClick: () => handleViewClick(u),
                        iconColor: 'text-primary-600 dark:text-primary-400'
                    },
                    {
                        label: t('users.resetPassword'),
                        icon: <Key size={16} strokeWidth={2.5} />,
                        onClick: () => handlePasswordClick(u),
                        hidden: !hasPermission(user, PERMISSIONS.USERS_EDIT),
                        iconColor: 'text-blue-600 dark:text-blue-400'
                    },
                    {
                        label: t('users.editProfile'),
                        icon: <Edit size={16} strokeWidth={2.5} />,
                        onClick: () => handleEditClick(u),
                        hidden: !hasPermission(user, PERMISSIONS.USERS_EDIT),
                        iconColor: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                        label: t('users.deleteUser'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDeleteClick(u),
                        hidden: !hasPermission(user, PERMISSIONS.USERS_DELETE) || u.username === 'admin' || u.id === user?.id,
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t, user, hasPermission])

    return (
        <div>
            {/* Search and Filters */}
            <div className="card mb-3">
                <div className="card-body p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-80">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('common.actions.search')}
                            </label>
                            <div className="relative group w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('users.searchPlaceholder')}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('users.role')}
                            </label>
                            <select
                                value={selectedRole}
                                onChange={(e) => handleRoleFilter(e.target.value)}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            >
                                <option value="">{t('users.allRoles')}</option>
                                {roles.map((role) => {
                                    const translationKey = `formatters.role.${role.code}`
                                    const translatedName = t(translationKey, { defaultValue: role.name })
                                    return (
                                        <option key={role.id} value={role.code}>
                                            {translatedName}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('common.labels.department')}
                            </label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => handleDepartmentFilter(e.target.value)}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            >
                                <option value="">{t('users.allDepartments')}</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full md:w-48">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('users.status')}
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                            >
                                <option value="">{t('users.allStatus')}</option>
                                <option value="active">{t('users.active')}</option>
                                <option value="inactive">{t('users.inactive')}</option>
                            </select>
                        </div>

                        <div className="flex-1 flex justify-end gap-3 w-full md:w-auto pb-1">
                            {hasPermission(user, PERMISSIONS.USERS_CREATE) && (
                                <button
                                    type="button"
                                    onClick={handleCreateClick}
                                    className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary-600/20"
                                >
                                    <UserPlus className="w-5 h-5 shadow-sm" />
                                    <span>{t('users.addUser')}</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Users table */}
            <div className="card overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-12">
                            <LoadingSpinner />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                <UserPlus className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('users.noUsers')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {users.map((u) => (
                                    <div key={u.id} className="p-4 bg-white dark:bg-gray-900">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-lg uppercase shadow-lg border border-primary-200 dark:border-primary-800 flex-shrink-0">
                                                {u.fullName?.charAt(0) || u.username?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{u.fullName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                                                    <Badge variant={u.isActive ? 'green' : 'gray'}>
                                                        <span className="flex items-center gap-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                            {u.isActive ? t('users.ready') : t('users.absent')}
                                                        </span>
                                                    </Badge>
                                                </div>
                                                {u.department?.name && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{u.department.name}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <button 
                                                onClick={() => handleViewClick(u)} 
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white transition-all mr-3"
                                            >
                                                <Eye size={13} /> {t('common.actions.view')}
                                            </button>
                                            
                                            <ActionMenu actions={[
                                                {
                                                    label: t('common.actions.view'),
                                                    icon: <Eye size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleViewClick(u),
                                                    iconColor: 'text-primary-600 dark:text-primary-400'
                                                },
                                                {
                                                    label: t('users.resetPassword'),
                                                    icon: <Key size={16} strokeWidth={2.5} />,
                                                    onClick: () => handlePasswordClick(u),
                                                    hidden: !hasPermission(user, PERMISSIONS.USERS_EDIT),
                                                    iconColor: 'text-blue-600 dark:text-blue-400'
                                                },
                                                {
                                                    label: t('users.editProfile'),
                                                    icon: <Edit size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleEditClick(u),
                                                    hidden: !hasPermission(user, PERMISSIONS.USERS_EDIT),
                                                    iconColor: 'text-amber-600 dark:text-amber-400'
                                                },
                                                {
                                                    label: t('users.deleteUser'),
                                                    icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleDeleteClick(u),
                                                    hidden: !hasPermission(user, PERMISSIONS.USERS_DELETE) || u.username === 'admin' || u.id === user?.id,
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
                                    rowData={users}
                                    columnDefs={columnDefs}
                                    onRowClicked={(params) => handleViewClick(params.data)}
                                    pagination={true}
                                    currentPage={pagination.pageNumber}
                                    totalPages={pagination.totalPages}
                                    pageSize={pagination.pageSize}
                                    onPageChange={(page) => dispatch(setPage(page))}
                                    onPageSizeChange={(size) => dispatch(setPageSize(size))}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={t('users.confirmDelete')}
                message={t('users.confirmDeleteMessage', { name: userToDelete?.fullName })}
                confirmText={t('common.actions.delete')}
                cancelText={t('common.actions.cancel')}
                type="danger"
            />

            {/* User Form Modal */}
            <UserFormModal
                isOpen={formModalOpen}
                onClose={handleFormClose}
                user={selectedUser}
                mode={formMode}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={passwordModalOpen}
                onClose={handlePasswordClose}
                user={userForPassword}
            />

            {/* User Detail Modal */}
            <UserDetailModal
                isOpen={userDetailModalOpen}
                onClose={() => setUserDetailModalOpen(false)}
                user={selectedUser}
            />
        </div>
    )
}

export default UsersPage
