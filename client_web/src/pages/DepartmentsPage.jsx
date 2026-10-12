import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Building2, Edit, Trash2, Plus, Eye } from 'lucide-react'
import {
    fetchDepartments,
    deleteDepartment,
    selectAllDepartments,
    selectDepartmentsLoading,
    selectDepartmentsPagination,
    setPage,
    setPageSize,
} from '../store/departmentsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import ConfirmModal from '../components/common/ConfirmModal'
import DepartmentFormModal from '../components/departments/DepartmentFormModal'
import DepartmentDetailModal from '../components/departments/DepartmentDetailModal'
import { PERMISSIONS } from '../utils/constants'
import { hasPermission } from '../utils/permissions'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/formatters'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'

const DepartmentsPage = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useAuth()
    const departments = useSelector(selectAllDepartments)
    const loading = useSelector(selectDepartmentsLoading)
    const pagination = useSelector(selectDepartmentsPagination)

    const [searchTerm, setSearchTerm] = useState('')
    const [filteredDepartments, setFilteredDepartments] = useState([])
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deptToDelete, setDeptToDelete] = useState(null)
    const [formModalOpen, setFormModalOpen] = useState(false)
    const [formMode, setFormMode] = useState('create')
    const [selectedDept, setSelectedDept] = useState(null)
    const [detailModalOpen, setDetailModalOpen] = useState(false)

    useEffect(() => {
        dispatch(fetchDepartments({
            pageNumber: pagination.pageNumber,
            pageSize: pagination.pageSize,
            searchTerm: searchTerm
        }))
    }, [dispatch, pagination.pageNumber, pagination.pageSize])

    useEffect(() => {
        if (searchTerm) {
            const filtered = departments.filter(
                (dept) =>
                    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredDepartments(filtered)
        } else {
            setFilteredDepartments(departments)
        }
    }, [searchTerm, departments])

    const handleSearch = (e) => {
        e.preventDefault()
    }

    const handleDeleteClick = (dept) => {
        setDeptToDelete(dept)
        setDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (deptToDelete) {
            await dispatch(deleteDepartment(deptToDelete.id))
            setDeptToDelete(null)
        }
    }

    const handleCreateClick = () => {
        setFormMode('create')
        setSelectedDept(null)
        setFormModalOpen(true)
    }

    const handleEditClick = (dept) => {
        setFormMode('edit')
        setSelectedDept(dept)
        setFormModalOpen(true)
    }

    const handleViewClick = (dept) => {
        setSelectedDept(dept)
        setDetailModalOpen(true)
    }

    const handleFormClose = () => {
        setFormModalOpen(false)
        setSelectedDept(null)
        dispatch(fetchDepartments())
    }

    const columnDefs = useMemo(() => [
        {
            headerName: t('departments.departmentCode'),
            field: 'code',
            cellRenderer: (params) => (
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm group-hover:scale-105 transition-all duration-300">
                    <span className="font-mono text-[11px] font-black tracking-widest text-primary-700 dark:text-primary-400 uppercase">
                        {params.value}
                    </span>
                </div>
            )
        },
        {
            headerName: t('departments.departmentName'),
            field: 'name',
            cellRenderer: (params) => (
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {params.value}
                </span>
            )
        },
        {
            headerName: t('departments.description'),
            field: 'description',
            flex: 2,
            cellRenderer: (params) => (
                <span className="text-gray-500 dark:text-gray-400 text-xs italic max-w-xs truncate block">
                    {params.value || t('departments.emptyDescription')}
                </span>
            )
        },
        {
            headerName: t('common.labels.status'),
            field: 'isActive',
            cellRenderer: (params) => (
                <div className="transform transition-all duration-300 group-hover:scale-105">
                    <Badge variant={params.value ? 'green' : 'gray'}>
                        <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${params.value ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                            {params.value ? t('departments.active') : t('departments.inactive')}
                        </span>
                    </Badge>
                </div>
            )
        },
        {
            headerName: t('departments.createdAt'),
            field: 'createdAt',
            cellRenderer: (params) => (
                <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">
                    {formatDate(params.value)}
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
                const dept = params.data;
                const actions = [
                    {
                        label: t('common.actions.view'),
                        icon: <Eye size={16} strokeWidth={2.5} />,
                        onClick: () => handleViewClick(dept),
                        iconColor: 'text-primary-600 dark:text-primary-400'
                    },
                    {
                        label: t('departments.editStructure'),
                        icon: <Edit size={16} strokeWidth={2.5} />,
                        onClick: () => handleEditClick(dept),
                        hidden: !hasPermission(user, PERMISSIONS.DEPARTMENTS_EDIT),
                        iconColor: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                        label: t('departments.removeUnit'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDeleteClick(dept),
                        hidden: !hasPermission(user, PERMISSIONS.DEPARTMENTS_DELETE),
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t, user, hasPermission]);

    return (
        <div>
            {/* Search */}
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
                                    placeholder={t('departments.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex justify-end gap-3 w-full md:w-auto pb-1">
                            {hasPermission(user, PERMISSIONS.DEPARTMENTS_CREATE) && (
                                <button
                                    type="button"
                                    onClick={handleCreateClick}
                                    className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary-600/20"
                                >
                                    <Plus className="w-5 h-5 shadow-sm" />
                                    <span>{t('departments.addDepartment')}</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Departments table */}
            <div className="card overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-12">
                            <LoadingSpinner />
                        </div>
                    ) : filteredDepartments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                <Building2 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {searchTerm ? t('departments.noResults') : t('departments.noDepartments')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredDepartments.map((dept) => (
                                    <div key={dept.id} className="p-4 bg-white dark:bg-gray-900">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center border border-primary-200 dark:border-primary-800 flex-shrink-0">
                                                <span className="font-mono text-[10px] font-black tracking-widest text-primary-700 dark:text-primary-400 uppercase">{dept.code?.slice(0, 3)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{dept.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{dept.description || t('departments.emptyDescription')}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="font-mono text-[10px] font-black tracking-widest text-primary-700 dark:text-primary-400">{dept.code}</span>
                                                    <Badge variant={dept.isActive ? 'green' : 'gray'}>
                                                        <span className="flex items-center gap-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${dept.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                            {dept.isActive ? t('departments.active') : t('departments.inactive')}
                                                        </span>
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <button 
                                                onClick={() => handleViewClick(dept)} 
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white transition-all mr-3"
                                            >
                                                <Eye size={13} /> {t('common.actions.view')}
                                            </button>
                                            
                                            <ActionMenu actions={[
                                                {
                                                    label: t('common.actions.view'),
                                                    icon: <Eye size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleViewClick(dept),
                                                    iconColor: 'text-primary-600 dark:text-primary-400'
                                                },
                                                {
                                                    label: t('departments.editStructure'),
                                                    icon: <Edit size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleEditClick(dept),
                                                    hidden: !hasPermission(user, PERMISSIONS.DEPARTMENTS_EDIT),
                                                    iconColor: 'text-amber-600 dark:text-amber-400'
                                                },
                                                {
                                                    label: t('departments.removeUnit'),
                                                    icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleDeleteClick(dept),
                                                    hidden: !hasPermission(user, PERMISSIONS.DEPARTMENTS_DELETE),
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
                                    rowData={filteredDepartments}
                                    columnDefs={columnDefs}
                                    onRowClicked={(params) => handleViewClick(params.data)}
                                    // Integrated pagination props
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
                title={t('departments.confirmDelete')}
                message={t('departments.confirmDeleteMessage', { name: deptToDelete?.name })}
                confirmText={t('common.actions.delete')}
                cancelText={t('common.actions.cancel')}
                type="danger"
            />

            {/* Department Form Modal */}
            <DepartmentFormModal
                isOpen={formModalOpen}
                onClose={handleFormClose}
                department={selectedDept}
                mode={formMode}
            />

            {/* Department Detail Modal */}
            <DepartmentDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                department={selectedDept}
            />
        </div>
    )
}

export default DepartmentsPage
