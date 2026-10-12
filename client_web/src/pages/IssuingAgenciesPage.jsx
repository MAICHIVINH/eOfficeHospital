import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Building2, Edit, Trash2, Plus, Eye } from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import ConfirmModal from '../components/common/ConfirmModal'
import IssuingAgencyFormModal from '../components/issuingAgencies/IssuingAgencyFormModal'
import { PERMISSIONS } from '../utils/constants'
import { hasPermission } from '../utils/permissions'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/formatters'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'
import { getIssuingAgencies, deleteIssuingAgency } from '../api/issuingAgenciesApi'
import toast from 'react-hot-toast'

const IssuingAgenciesPage = () => {
    const { t } = useTranslation()
    const { user } = useAuth()
    
    const [agencies, setAgencies] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [pageNumber, setPageNumber] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [agencyToDelete, setAgencyToDelete] = useState(null)
    const [formModalOpen, setFormModalOpen] = useState(false)
    const [formMode, setFormMode] = useState('create')
    const [selectedAgency, setSelectedAgency] = useState(null)

    const fetchAgenciesData = async () => {
        setLoading(true)
        try {
            const data = await getIssuingAgencies()
            setAgencies(data)
        } catch (error) {
            console.error('Failed to fetch agencies:', error)
            toast.error(t('common.messages.loadFailed'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAgenciesData()
    }, [])

    const filteredAgencies = useMemo(() => {
        if (!searchTerm) return agencies
        const term = searchTerm.toLowerCase()
        return agencies.filter(a => 
            a.name?.toLowerCase().includes(term) || 
            a.code?.toLowerCase().includes(term) ||
            a.agencyType?.toLowerCase().includes(term) ||
            a.address?.toLowerCase().includes(term) ||
            a.phoneNumber?.toLowerCase().includes(term)
        )
    }, [searchTerm, agencies])

    const paginatedAgencies = useMemo(() => {
        const startIndex = (pageNumber - 1) * pageSize
        return filteredAgencies.slice(startIndex, startIndex + pageSize)
    }, [filteredAgencies, pageNumber, pageSize])

    const totalPages = useMemo(() => {
        return Math.ceil(filteredAgencies.length / pageSize) || 1
    }, [filteredAgencies.length, pageSize])

    useEffect(() => {
        setPageNumber(1)
    }, [searchTerm])

    const handleDeleteClick = (agency) => {
        setAgencyToDelete(agency)
        setDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (agencyToDelete) {
            try {
                await deleteIssuingAgency(agencyToDelete.id)
                toast.success(t('common.messages.deleteSuccess'))
                fetchAgenciesData()
            } catch (error) {
                console.error('Delete error:', error)
                toast.error(t('common.messages.deleteFailed'))
            } finally {
                setDeleteModalOpen(false)
                setAgencyToDelete(null)
            }
        }
    }

    const handleCreateClick = () => {
        setFormMode('create')
        setSelectedAgency(null)
        setFormModalOpen(true)
    }

    const handleEditClick = (agency) => {
        setFormMode('edit')
        setSelectedAgency(agency)
        setFormModalOpen(true)
    }

    const handleViewClick = (agency) => {
        setFormMode('view')
        setSelectedAgency(agency)
        setFormModalOpen(true)
    }

    const columnDefs = useMemo(() => [
        {
            headerName: t('common.labels.code'),
            field: 'code',
            width: 130,
            cellRenderer: (params) => (
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm group-hover:scale-105 transition-all duration-300">
                    <span className="font-mono text-[11px] font-black tracking-widest text-blue-700 dark:text-blue-400 uppercase">
                        {params.value}
                    </span>
                </div>
            )
        },
        {
            headerName: t('common.labels.name'),
            field: 'name',
            minWidth: 200,
            cellRenderer: (params) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {params.value}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Building2 size={10} />
                        {params.data.agencyType}
                    </span>
                </div>
            )
        },
        {
            headerName: t('common.labels.address'),
            field: 'address',
            minWidth: 200,
            cellRenderer: (params) => (
                <span className="text-gray-600 dark:text-gray-400 text-xs italic truncate block" title={params.value}>
                    {params.value || '-'}
                </span>
            )
        },
        {
            headerName: t('common.labels.phone'),
            field: 'phoneNumber',
            width: 130,
            cellRenderer: (params) => (
                <span className="text-gray-600 dark:text-gray-400 text-xs">
                    {params.value || '-'}
                </span>
            )
        },
        {
            headerName: t('common.labels.status'),
            field: 'isActive',
            width: 120,
            cellRenderer: (params) => (
                <Badge variant={params.value ? 'green' : 'gray'}>
                    <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${params.value ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        {params.value ? t('departments.active') : t('departments.inactive')}
                    </span>
                </Badge>
            )
        },
        {
            headerName: t('common.labels.actions'),
            field: 'actions',
            width: 80,
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const agency = params.data;
                const actions = [
                    {
                        label: t('common.actions.view'),
                        icon: <Eye size={16} strokeWidth={2.5} />,
                        onClick: () => handleViewClick(agency),
                        iconColor: 'text-blue-600 dark:text-blue-400'
                    },
                    {
                        label: t('common.actions.edit'),
                        icon: <Edit size={16} strokeWidth={2.5} />,
                        onClick: () => handleEditClick(agency),
                        hidden: !hasPermission(user, PERMISSIONS.ISSUING_AGENCIES_EDIT),
                        iconColor: 'text-amber-600 dark:text-amber-400'
                    },
                    {
                        label: t('common.actions.delete'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDeleteClick(agency),
                        hidden: !hasPermission(user, PERMISSIONS.ISSUING_AGENCIES_DELETE),
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t, user, hasPermission]);

    return (
        <div>
            <div className="card mb-3">
                <div className="card-body p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-80">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('common.actions.search')}
                            </label>
                            <div className="relative group w-full">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('documents.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex justify-end gap-3 w-full md:w-auto pb-1">
                            {hasPermission(user, PERMISSIONS.ISSUING_AGENCIES_CREATE) && (
                                <button
                                    type="button"
                                    onClick={handleCreateClick}
                                    className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary-600/20"
                                >
                                    <Plus className="w-5 h-5 shadow-sm" />
                                    <span>{t('common.actions.add')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="py-12">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <Table
                            rowData={paginatedAgencies}
                            columnDefs={columnDefs}
                            pagination={true}
                            currentPage={pageNumber}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            onPageChange={(page) => setPageNumber(page)}
                            onPageSizeChange={(size) => {
                                setPageSize(size)
                                setPageNumber(1)
                            }}
                        />
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={t('common.messages.confirmDelete')}
                message={t('documents.confirmDeleteMessage', { title: agencyToDelete?.name })}
                confirmText={t('common.actions.delete')}
                cancelText={t('common.actions.cancel')}
                type="danger"
            />

            <IssuingAgencyFormModal
                isOpen={formModalOpen}
                onClose={() => setFormModalOpen(false)}
                agency={selectedAgency}
                mode={formMode}
                onSuccess={fetchAgenciesData}
            />
        </div>
    )
}

export default IssuingAgenciesPage
