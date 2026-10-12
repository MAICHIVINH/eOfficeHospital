import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Download, Eye, FileText, Archive, BarChart3, Calendar, FileSpreadsheet, X } from 'lucide-react'
import { fetchDocuments } from '../store/documentsSlice'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { formatDate, formatTime, formatDocumentType } from '../utils/formatters'
import { DOCUMENT_CATEGORY, WORKFLOW_STATUS, DOCUMENT_TYPES, DOCUMENT_TYPE_ENUM } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'
import OutgoingDocumentDetailModal from '../components/documents/OutgoingDocumentDetailModal'
import { getArchiveStatistics, exportOutgoingToExcel, downloadDocument, exportArchiveOutgoingToExcel } from '../api/documentsApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import Table from '../components/common/Table'
import ActionMenu from '../components/common/ActionMenu'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const OutgoingArchivePage = () => {
    const dispatch = useDispatch()
    const { documents, loading, pagination } = useSelector((state) => state.documents)
    const { t } = useTranslation()
    const { user } = useAuth()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState('')

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState(null)

    const [showStats, setShowStats] = useState(false)
    const [statsData, setStatsData] = useState([])
    const [statsLoading, setStatsLoading] = useState(false)

    const months = Array.from({ length: 12 }, (_, i) => i + 1)

    const defaultParams = useMemo(() => ({
        category: DOCUMENT_CATEGORY.OUTGOING,
        workflowStatus: WORKFLOW_STATUS.ARCHIVED,
        year: selectedYear || undefined,
        month: selectedMonth ? parseInt(selectedMonth) : undefined,
        documentType: selectedType || undefined
    }), [selectedYear, selectedMonth, selectedType])

    useEffect(() => {
        dispatch(fetchDocuments(defaultParams))
    }, [dispatch, defaultParams])

    const handleSearch = (e) => {
        e.preventDefault()
        dispatch(fetchDocuments({
            ...defaultParams,
            search: searchTerm
        }))
    }

    const handleExportAnnual = async () => {
        try {
            toast.loading(t('documents.exporting'))
            const blob = await exportArchiveOutgoingToExcel(selectedYear)
            const url = window.URL.createObjectURL(new Blob([blob]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Kho_VanBanDi_${selectedYear}.xlsx`)
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

    const handleShowStats = async () => {
        setShowStats(true)
        setStatsLoading(true)
        try {
            const data = await getArchiveStatistics(selectedYear, DOCUMENT_CATEGORY.OUTGOING)
            setStatsData(data)
        } catch (err) {
            console.error('Stats error:', err)
            toast.error(t('common.messages.error'))
        } finally {
            setStatsLoading(false)
        }
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
            }
        } catch (err) {
            toast.error(t('documents.downloadFailed'))
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
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                                <FileText size={20} />
                            </div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate leading-tight">
                                {doc.title}
                            </span>
                            <span className="text-[11px] mt-1 text-gray-400 dark:text-gray-600 font-medium truncate leading-tight">
                                {doc.documentNumber || t('outgoingWorkflow.notIssued')}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            headerName: t('documents.documentType'),
            field: 'documentType',
            width: 120,
            cellRenderer: (params) => (
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {formatDocumentType(params.value)}
                </span>
            )
        },
        {
            headerName: t('common.labels.createdBy'),
            field: 'createdByName',
            width: 180,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
                        {(params.value || 'N/A').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm leading-tight">
                        {params.value || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            headerName: t('common.labels.createdAt'),
            field: 'createdAt',
            width: 150,
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
            headerName: t('common.labels.actions'),
            field: 'actions',
            width: 70,
            cellClass: 'flex justify-center',
            headerClass: 'text-center',
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <ActionMenu actions={[
                    {
                        label: t('documents.viewDetail'),
                        icon: <Eye size={16} />,
                        onClick: () => {
                            setSelectedDoc(params.data)
                            setIsDetailModalOpen(true)
                        },
                        iconColor: 'text-blue-600'
                    },
                    {
                        label: t('documents.downloadDocument'),
                        icon: <Download size={16} />,
                        onClick: () => handleDownload(params.data),
                        iconColor: 'text-gray-600'
                    }
                ]} />
            )
        }
    ], [t])

    return (
        <div className="animate-in fade-in duration-500">
            {/* Filters Section */}
            <div className="card mb-3">
                <div className="card-body p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
                        {/* Search Bar */}
                        <div className="xl:col-span-2">
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
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    className="form-input w-full pl-11 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                                />
                            </div>
                        </div>
 
                        {/* Year Selector */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('documents.year')}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="number"
                                    min="2000"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : '')}
                                    className="form-input w-full pl-11 pr-2 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-bold"
                                    placeholder={t('documents.year')}
                                />
                            </div>
                        </div>
 
                        {/* Month Selector */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('documents.month')}
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-bold cursor-pointer"
                            >
                                <option value="">{t('common.labels.all')}</option>
                                {months.map(m => <option key={m} value={m}>{t('common.labels.month')} {m}</option>)}
                            </select>
                        </div>
 
                        {/* Type Selector */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                {t('documents.documentType')}
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="form-select w-full py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-bold cursor-pointer"
                            >
                                <option value="">{t('common.labels.all')}</option>
                                {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                                    <option key={key} value={DOCUMENT_TYPE_ENUM[key]}>
                                        {t(`formatters.documentType.${key}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
 
                    <div className="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                        <button
                            type="button"
                            onClick={handleShowStats}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <BarChart3 className="w-4 h-4 text-primary-600" />
                            <span>{t('documents.statistics')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportAnnual}
                            className="btn btn-primary flex items-center gap-2 shadow-xl shadow-primary-600/20"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>{t('documents.exportAnnual')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex flex-col gap-6">
                <div className="flex-1 min-w-0">
                    <div className="card border-none shadow-sm overflow-hidden bg-white dark:bg-gray-800/40 backdrop-blur-sm">
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="py-20"><LoadingSpinner /></div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-800">
                                        <Archive className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-bold">{t('documents.noDocuments')}</p>
                                </div>
                            ) : (
                                <Table
                                    rowData={documents}
                                    columnDefs={columnDefs}
                                    onRowClicked={(params) => {
                                        setSelectedDoc(params.data)
                                        setIsDetailModalOpen(true)
                                    }}
                                    pagination={true}
                                    currentPage={pagination.pageNumber}
                                    totalPages={pagination.totalPages}
                                    pageSize={pagination.pageSize}
                                    onPageChange={(page) => dispatch(fetchDocuments({ ...defaultParams, pageNumber: page }))}
                                    onPageSizeChange={(size) => dispatch(fetchDocuments({ ...defaultParams, pageSize: size }))}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Modal */}
            {showStats && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-gray-800">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/10">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                    <BarChart3 className="w-6 h-6 text-primary-600" />
                                    {t('documents.monthlyStats')} - {selectedYear}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 font-medium">{t('documents.statsSubtitleOutgoing') || 'Tổng số văn bản đi đã phát hành theo từng tháng'}</p>
                            </div>
                            <button onClick={() => setShowStats(false)} className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            {statsLoading ? (
                                <div className="h-80 flex items-center justify-center"><LoadingSpinner /></div>
                            ) : (
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                                                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                                                tickFormatter={(val) => `T${val}`}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                    backdropFilter: 'blur(8px)'
                                                }}
                                                labelFormatter={(val) => `${t('common.labels.month')} ${val}`}
                                            />
                                            <Bar
                                                dataKey="count"
                                                radius={[8, 8, 0, 0]}
                                                barSize={32}
                                                animationDuration={1500}
                                            >
                                                {statsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <div className="grid grid-cols-4 gap-4 mt-8">
                                <div className="bg-primary-50/50 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-800/30">
                                    <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">{t('documents.totalYear') || 'Tổng cả năm'}</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
                                        {statsData.reduce((acc, curr) => acc + curr.count, 0)}
                                    </p>
                                </div>
                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('documents.avgMonth') || 'TB tháng'}</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
                                        {(statsData.reduce((acc, curr) => acc + curr.count, 0) / 12).toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <OutgoingDocumentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false)
                    setSelectedDoc(null)
                }}
                documentId={selectedDoc?.id}
            />
        </div>
    )
}

export default OutgoingArchivePage
