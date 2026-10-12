import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Bell,
    Trash2,
    RefreshCw,
    User as UserIcon,
    Clock,
    ExternalLink,
    Search,
    AlertCircle
} from 'lucide-react'
import { notificationApi } from '../api/notificationApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import ConfirmModal from '../components/common/ConfirmModal'
import { formatDateTime } from '../utils/formatters'
import toast from 'react-hot-toast'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'

const NotificationManagementPage = () => {
    const { t } = useTranslation()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [notificationToDelete, setNotificationToDelete] = useState(null)

    const fetchAllNotifications = async () => {
        setLoading(true)
        try {
            const data = await notificationApi.getAdminNotifications(200)
            setNotifications(data || [])
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            toast.error(t('common.messages.loadFailed'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllNotifications()
    }, [])

    const handleDeleteClick = (notification) => {
        setNotificationToDelete(notification)
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        if (!notificationToDelete) return

        try {
            await notificationApi.adminDeleteNotification(notificationToDelete.id)
            setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id))
            toast.success(t('common.messages.deleteSuccess'))
        } catch (error) {
            console.error('Failed to delete notification:', error)
            toast.error(t('common.messages.deleteFailed'))
        } finally {
            setShowDeleteModal(false)
            setNotificationToDelete(null)
        }
    }

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.userFullName && n.userFullName.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const totalPages = Math.ceil(filteredNotifications.length / pageSize)

    // Sliced data for client-side pagination
    const paginatedNotifications = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return filteredNotifications.slice(startIndex, startIndex + pageSize)
    }, [filteredNotifications, currentPage, pageSize])

    const getTypeBadgeVariant = (type) => {
        const typeStr = String(type)
        switch (typeStr) {
            case '7': return 'danger'    // SystemMaintenance
            case '3': return 'primary'   // NewAssignment
            case '1': return 'warning'   // DocumentRejected
            case '4':
            case '10': return 'success'  // Published/Issued
            case '2': return 'info'      // SignatureRequest
            default: return 'info'
        }
    }



    const columnDefs = useMemo(() => [
        {
            headerName: t('notifications.time'),
            field: 'createdAt',
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock size={14} className="group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-semibold">
                        {formatDateTime(params.value)}
                    </span>
                </div>
            )
        },
        {
            headerName: t('notifications.recipient'),
            field: 'userFullName',
            cellRenderer: (params) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-lg border border-primary-200 dark:border-primary-800 group-hover:scale-110 transition-all duration-300">
                        <UserIcon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {params.value || 'Unknown'}
                    </span>
                </div>
            )
        },
        {
            headerName: t('notifications.type'),
            field: 'type',
            cellRenderer: (params) => (
                <div className="transform transition-all duration-300 group-hover:scale-105">
                    <Badge variant={getTypeBadgeVariant(params.value)}>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {t(`notifications.types.${params.value}`)}
                        </span>
                    </Badge>
                </div>
            )
        },
        {
            headerName: t('notifications.content'),
            field: 'title',
            flex: 2,
            cellRenderer: (params) => (
                <div className="max-w-md">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {params.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {params.data.message}
                    </p>
                </div>
            )
        },
        {
            headerName: t('notifications.actions'),
            field: 'actions',
            width: 70,
            flex: 0.5,
            cellClass: 'flex justify-center',
            headerClass: 'text-center',
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const notification = params.data;
                const actions = [
                    {
                        label: t('common.actions.view'),
                        icon: <ExternalLink size={16} strokeWidth={2.5} />,
                        onClick: () => { window.location.href = notification.link },
                        hidden: !notification.link,
                        iconColor: 'text-blue-600 dark:text-blue-400'
                    },
                    {
                        label: t('common.actions.delete'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handleDeleteClick(notification),
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        }
    ], [t]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search & Sync Bar */}
            <div className="card bg-white dark:bg-gray-900 border-none shadow-sm">
                <div className="card-body p-4">
                    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-80">
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('common.actions.search')}
                            </label>
                            <div className="relative group w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('common.actions.search') + '...'}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden">
                <div className="card-body p-0">
                    {loading && notifications.length === 0 ? (
                        <div className="py-12">
                            <LoadingSpinner />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                <Bell className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('notifications.noNotifications')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedNotifications.map((notification) => (
                                    <div key={notification.id} className="p-4 bg-white dark:bg-gray-900">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 flex-shrink-0">
                                                <UserIcon size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{notification.userFullName || 'Unknown'}</p>
                                                <p className="text-xs text-gray-700 dark:text-gray-300 font-semibold mt-0.5 line-clamp-1">{notification.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{notification.message}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Badge variant={getTypeBadgeVariant(notification.type)}>
                                                        <span className="text-[10px] font-black uppercase">{t(`notifications.types.${notification.type}`)}</span>
                                                    </Badge>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <Clock size={10} />{formatDateTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            {notification.link ? (
                                                <a 
                                                    href={notification.link} 
                                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white transition-all mr-3"
                                                >
                                                    <ExternalLink size={14} /> {t('common.actions.view')}
                                                </a>
                                            ) : (
                                                <div className="flex-1" />
                                            )}
                                            
                                            <ActionMenu actions={[
                                                {
                                                    label: t('common.actions.view'),
                                                    icon: <ExternalLink size={16} strokeWidth={2.5} />,
                                                    onClick: () => { window.location.href = notification.link },
                                                    hidden: !notification.link,
                                                    iconColor: 'text-blue-600 dark:text-blue-400'
                                                },
                                                {
                                                    label: t('common.actions.delete'),
                                                    icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleDeleteClick(notification),
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
                                    rowData={paginatedNotifications}
                                    columnDefs={columnDefs}
                                    // Integrated pagination props
                                    pagination={true}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setNotificationToDelete(null)
                }}
                onConfirm={handleDeleteConfirm}
                title={t('notifications.deleteConfirmTitle')}
                message={t('notifications.deleteConfirmMessage')}
                confirmText={t('common.actions.delete')}
                type="danger"
            />
        </div>
    )
}

export default NotificationManagementPage
