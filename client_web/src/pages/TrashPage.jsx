import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
    Trash2,
    RotateCcw,
    FileText,
    Users,
    Building2,
    Shield,
    ClipboardList,
    AlertTriangle,
    ChevronRight,
    CheckSquare,
    Square,
    History
} from 'lucide-react'
import { fetchDeletedItems, restoreItem, permanentDeleteItem, bulkPermanentDeleteItem } from '../store/trashSlice'
import { isAdmin } from '../utils/permissions'
import ConfirmModal from '../components/common/ConfirmModal'
import Table from '../components/common/Table'
import { formatDocumentType } from '../utils/formatters'
import ActionMenu from '../components/common/ActionMenu'

const TrashPage = () => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const { loading, documents, users, departments, roles, assignments, auditlogs } = useSelector(state => state.trash)

    const [activeTab, setActiveTab] = useState('document')
    const [selectedItem, setSelectedItem] = useState(null)
    const [showConfirm, setShowConfirm] = useState(null) // 'restore' | 'delete' | 'bulkDelete'
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selectedItems, setSelectedItems] = useState(new Set())
    const [canScrollRight, setCanScrollRight] = useState(false)
    const tabScrollRef = useRef(null)

    useEffect(() => {
        dispatch(fetchDeletedItems(activeTab))
    }, [dispatch, activeTab])

    // Reset pagination and selection when tab changes
    useEffect(() => {
        setCurrentPage(1)
        setSelectedItems(new Set())
    }, [activeTab])

    // Reset selection when page changes
    useEffect(() => {
        setSelectedItems(new Set())
    }, [currentPage])

    // Check if tabs can scroll right
    const checkScroll = (el) => {
        if (el) setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    useEffect(() => {
        const el = tabScrollRef.current
        if (!el) return
        checkScroll(el)
        el.addEventListener('scroll', () => checkScroll(el))
        window.addEventListener('resize', () => checkScroll(el))
        return () => {
            el.removeEventListener('scroll', () => checkScroll(el))
            window.removeEventListener('resize', () => checkScroll(el))
        }
    }, [])

    const scrollTabsRight = () => {
        if (tabScrollRef.current) tabScrollRef.current.scrollBy({ left: 120, behavior: 'smooth' })
    }

    const tabs = [
        { id: 'document', label: t('trash.documents'), icon: FileText },
        { id: 'user', label: t('trash.users'), icon: Users },
        { id: 'department', label: t('trash.departments'), icon: Building2 },
        { id: 'role', label: t('trash.roles'), icon: Shield },
        { id: 'assignment', label: t('trash.assignments'), icon: ClipboardList },
        { id: 'auditlog', label: t('sidebar.menu.auditLogs'), icon: History },
    ]

    const handleRestore = (item) => {
        setSelectedItem(item)
        setShowConfirm('restore')
    }

    const handlePermanentDelete = (item) => {
        setSelectedItem(item)
        setShowConfirm('delete')
    }

    const handleSelectItem = (itemId) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId)
        } else {
            newSelected.add(itemId)
        }
        setSelectedItems(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedItems.size === paginatedItems.length) {
            setSelectedItems(new Set())
        } else {
            setSelectedItems(new Set(paginatedItems.map(item => item.id)))
        }
    }

    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return
        setShowConfirm('bulkDelete')
    }

    const confirmAction = async () => {
        if (showConfirm === 'bulkDelete') {
            // Bulk delete selected items
            const idsToDelete = Array.from(selectedItems)
            await dispatch(bulkPermanentDeleteItem({ entityType: activeTab, ids: idsToDelete }))
            setSelectedItems(new Set())
            setShowConfirm(null)
        } else {
            if (!selectedItem) return

            if (showConfirm === 'restore') {
                await dispatch(restoreItem({ entityType: activeTab, id: selectedItem.id }))
            } else {
                await dispatch(permanentDeleteItem({ entityType: activeTab, id: selectedItem.id }))
            }
            setShowConfirm(null)
            setSelectedItem(null)
        }
    }

    const itemsMap = {
        document: documents,
        user: users,
        department: departments,
        role: roles,
        assignment: assignments,
        auditlog: auditlogs
    }

    const currentItems = itemsMap[activeTab] || []

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (size) => {
        setPageSize(size)
        setCurrentPage(1) // Reset to first page when page size changes
    }

    // Calculate pagination
    const totalPages = Math.ceil(currentItems.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedItems = currentItems.slice(startIndex, endIndex)

    const columnDefs = useMemo(() => {
        const defs = [];

        // Admin checkbox column
        if (isAdmin(user)) {
            defs.push({
                headerName: '',
                field: 'checkbox',
                width: 60,
                flex: 0,
                headerComponent: () => (
                    <button
                        onClick={handleSelectAll}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title={selectedItems.size === paginatedItems.length ? t('permissions.deselectAll') : t('permissions.selectAll')}
                    >
                        {selectedItems.size === (paginatedItems.length || 0) && paginatedItems.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                        ) : (
                            <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" strokeWidth={2.5} />
                        )}
                    </button>
                ),
                cellRenderer: (params) => (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSelectItem(params.data.id); }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                        {selectedItems.has(params.data.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                        ) : (
                            <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" strokeWidth={2.5} />
                        )}
                    </button>
                ),
                sortable: false,
                filter: false,
            });
        }

        // Name column
        defs.push({
            headerName: t('common.labels.name'),
            field: 'name',
            flex: 2,
            minWidth: 250,
            cellRenderer: (params) => {
                const item = params.data;
                const displayName = activeTab === 'auditlog'
                    ? (item.userFullName || item.username || item.id)
                    : (item.documentTitle || item.title || item.username || item.name || item.id);
                return (
                    <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {displayName}
                        </div>
                        {activeTab === 'auditlog' && item.username && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                @{item.username}
                            </div>
                        )}
                        {activeTab === 'auditlog' && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                                {item.action}
                            </div>
                        )}
                        {item.departmentName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                {item.departmentName}
                            </div>
                        )}
                        {item.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                {item.email}
                            </div>
                        )}
                    </div>
                );
            }
        });

        // Document Type column (for document tab)
        if (activeTab === 'document') {
            defs.push({
                headerName: t('documents.documentType'),
                field: 'documentType',
                flex: 0.75,
                width: 150,
                cellRenderer: (params) => {
                    const item = params.data;
                    return (
                        <div className="transform transition-all duration-300 group-hover:scale-105">
                            <span className={`inline-flex items-center px-3 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${item.category === 1
                                ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 dark:from-blue-900/30 dark:to-blue-800/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                : 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 dark:from-purple-900/30 dark:to-purple-800/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                                }`}>
                                {item.category === 1 ? t('documents.incoming') : t('documents.outgoing')}
                            </span>
                        </div>
                    );
                }
            });
        }

        // Deleted At column
        defs.push({
            headerName: t('trash.deletedAt'),
            field: 'deletedAt',
            flex: 0.75,
            width: 180,
            cellRenderer: (params) => (
                <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">
                    {new Date(params.value).toLocaleString()}
                </span>
            )
        });

        // Actions column
        defs.push({
            headerName: t('common.labels.actions'),
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
                        label: t('trash.restore'),
                        icon: <RotateCcw size={16} strokeWidth={2.5} />,
                        onClick: () => handleRestore(params.data),
                        iconColor: 'text-emerald-600 dark:text-emerald-400'
                    },
                    {
                        label: t('trash.permanentDelete'),
                        icon: <Trash2 size={16} strokeWidth={2.5} />,
                        onClick: () => handlePermanentDelete(params.data),
                        hidden: !isAdmin(user),
                        iconColor: 'text-rose-600 dark:text-rose-400'
                    }
                ];
                return <ActionMenu actions={actions} />;
            }
        });

        return defs;
    }, [activeTab, user, selectedItems, paginatedItems, t]);

    return (
        <div>
            {/* <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Trash2 className="w-6 h-6 text-red-500" />
                    {t('trash.title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('trash.subtitle')}</p>
            </div> */}

            {/* Tabs */}
            <div className="relative mb-3 flex items-center gap-2">
                <div ref={tabScrollRef} className="overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl w-max min-w-full sm:w-fit sm:min-w-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Nút mũi tên — chỉ hiện trên mobile khi còn tab để cuộn */}
                {canScrollRight && (
                    <button
                        onClick={scrollTabsRight}
                        className="sm:hidden flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 active:scale-90"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content Table */}
            <div className="card overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('common.labels.loading')}</p>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                                <Trash2 className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('trash.noItems')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card view */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {isAdmin(user) && selectedItems.size > 0 && (
                                    <div className="flex items-center justify-between px-4 py-3 bg-blue-50/80 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
                                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                            {t('trash.itemsSelected', { count: selectedItems.size })}
                                        </span>
                                        <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                                            <Trash2 size={14} strokeWidth={2.5} />{t('trash.deleteSelected')}
                                        </button>
                                    </div>
                                )}
                                {isAdmin(user) && paginatedItems.length > 0 && (
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                                        <button onClick={handleSelectAll} className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                                            {selectedItems.size === paginatedItems.length ? (
                                                <CheckSquare className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                                            ) : (
                                                <Square className="w-4 h-4" strokeWidth={2.5} />
                                            )}
                                            {t('permissions.selectAll')}
                                        </button>
                                    </div>
                                )}
                                {paginatedItems.map((item) => (
                                    <div key={item.id} className={`p-4 bg-white dark:bg-gray-900 ${selectedItems.has(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            {isAdmin(user) && (
                                                <button onClick={() => handleSelectItem(item.id)} className="mt-0.5 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0">
                                                    {selectedItems.has(item.id) ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                                                    )}
                                                </button>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-rose-600 transition-colors">
                                                    {activeTab === 'auditlog'
                                                        ? (item.userFullName || item.username || item.id)
                                                        : (item.documentTitle || item.title || item.username || item.name || item.id)
                                                    }
                                                </p>
                                                {activeTab === 'auditlog' && item.username && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">@{item.username}</p>
                                                )}
                                                {item.departmentName && <p className="text-xs text-gray-500 dark:text-gray-400">{item.departmentName}</p>}
                                                {item.email && <p className="text-xs text-gray-500 dark:text-gray-400">{item.email}</p>}
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    {activeTab === 'document' && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${item.category === 1
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                                            : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                                                            }`}>
                                                            {item.category === 1 ? t('documents.incoming') : t('documents.outgoing')}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(item.deletedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <button 
                                                onClick={() => handleRestore(item)} 
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all mr-3"
                                            >
                                                <RotateCcw size={13} strokeWidth={2.5} />{t('trash.restore')}
                                            </button>
                                            
                                            <ActionMenu actions={[
                                                {
                                                    label: t('trash.restore'),
                                                    icon: <RotateCcw size={16} strokeWidth={2.5} />,
                                                    onClick: () => handleRestore(item),
                                                    iconColor: 'text-emerald-600 dark:text-emerald-400'
                                                },
                                                {
                                                    label: t('trash.permanentDelete'),
                                                    icon: <Trash2 size={16} strokeWidth={2.5} />,
                                                    onClick: () => handlePermanentDelete(item),
                                                    hidden: !isAdmin(user),
                                                    iconColor: 'text-rose-600 dark:text-rose-400'
                                                }
                                            ]} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table view */}
                            <div className="hidden md:block">
                                {isAdmin(user) && selectedItems.size > 0 && (
                                    <div className="px-6 py-3 bg-blue-50/80 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                                {t('trash.itemsSelected', { count: selectedItems.size })}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-1.5"
                                        >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                            {t('trash.deleteSelected')}
                                        </button>
                                    </div>
                                )}
                                <Table
                                    rowData={paginatedItems}
                                    columnDefs={columnDefs}
                                    pagination={true}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={!!showConfirm}
                onClose={() => setShowConfirm(null)}
                onConfirm={confirmAction}
                title={
                    showConfirm === 'restore'
                        ? t('trash.confirmRestore')
                        : showConfirm === 'bulkDelete'
                            ? t('trash.confirmBulkDelete')
                            : t('trash.confirmPermanentDelete')
                }
                message={
                    showConfirm === 'restore'
                        ? t('trash.confirmRestoreMessage')
                        : showConfirm === 'bulkDelete'
                            ? t('trash.confirmBulkDeleteMessage', { count: selectedItems.size })
                            : t('trash.confirmPermanentDeleteMessage')
                }
                confirmText={t('common.actions.confirm')}
                cancelText={t('common.actions.cancel')}
                type={showConfirm === 'restore' ? 'info' : 'danger'}
            />
        </div>
    )
}

export default TrashPage
