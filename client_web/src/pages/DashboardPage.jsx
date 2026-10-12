import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FileText, Clock, AlertCircle, CheckCircle, Activity, ArrowRight, Eye, BarChart3, Table } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ClerkViewsChart from '../components/dashboard/ClerkViewsChart'
import { fetchDocuments, fetchDocumentStatistics } from '../store/documentsSlice'
import { fetchDepartmentStatistics, selectStatistics, fetchAdminDashboardStats, selectAdminDashboardStats } from '../store/assignmentsSlice'
import { fetchAuditStatistics, selectAuditStatistics } from '../store/auditLogsSlice'
import { formatDateTime } from '../utils/formatters'
import { ROLES, DOCUMENT_CATEGORY } from '../utils/constants'
import auditLogsApi from '../api/auditLogsApi'
import DepartmentDocsPieChart from '../components/dashboard/DepartmentDocsPieChart'
import { fetchAllAssignments, fetchMyDepartmentAssignments, selectAllAssignments, selectMyDepartmentAssignments } from '../store/assignmentsSlice'

const DashboardPage = () => {
    const { user } = useAuth()
    const dispatch = useDispatch()
    const { t } = useTranslation()

    const documents = useSelector((state) => state.documents.documents)
    const pagination = useSelector((state) => state.documents.pagination)
    const statistics = useSelector((state) => state.documents.statistics)
    const docsLoading = useSelector((state) => state.documents.loading)
    const assignmentStats = useSelector(selectStatistics)
    const auditStats = useSelector(selectAuditStatistics)
    const allAssignments = useSelector(selectAllAssignments)
    const myDepartmentAssignments = useSelector(selectMyDepartmentAssignments)
    const adminDashboardStats = useSelector(selectAdminDashboardStats)
    const assignmentsLoading = useSelector((state) => state.assignments.loading)
    const auditLoading = useSelector((state) => state.auditLogs.loading)

    const [clerkViews, setClerkViews] = useState([])
    const [clerkViewsLoading, setClerkViewsLoading] = useState(false)
    const [timeRange, setTimeRange] = useState('day')
    const [viewMode, setViewMode] = useState('chart') // 'chart' or 'table'
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
    const [customDateFrom, setCustomDateFrom] = useState('')
    const [customDateTo, setCustomDateTo] = useState('')

    const isAdmin = user?.role === ROLES.ADMIN
    const isDirector = user?.role === ROLES.DIRECTOR
    const isLeader = isAdmin || isDirector

    useEffect(() => {
        // Fetch recent documents
        dispatch(fetchDocuments({ pageSize: 5 }))

        // Fetch statistics based on role
        if (isLeader) {
            dispatch(fetchAdminDashboardStats())
            dispatch(fetchDocumentStatistics())
            dispatch(fetchAllAssignments())
            
            // Administrative stats only for Admin
            if (isAdmin) {
                dispatch(fetchAuditStatistics())
                fetchClerkViews()
            }
        } else if (user?.departmentId) {
            dispatch(fetchDepartmentStatistics(user.departmentId))
            dispatch(fetchMyDepartmentAssignments())
        }

        // Detect dark mode
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'))
        }
        checkDarkMode()

        // Watch for dark mode changes
        const observer = new MutationObserver(checkDarkMode)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        return () => observer.disconnect()
    }, [dispatch, isAdmin, user?.departmentId])

    const fetchClerkViews = async (range = timeRange, customFrom = null, customTo = null) => {
        try {
            setClerkViewsLoading(true)
            let data

            // Use state variables if not provided as arguments (important for Refresh)
            const from = customFrom || (range === 'custom' ? customDateFrom : null)
            const to = customTo || (range === 'custom' ? customDateTo : null)

            if (range === 'custom' && from && to) {
                // For custom range, we'll use the existing API with 'month' and filter on frontend
                data = await auditLogsApi.getClerkDocumentViews('month', 100)

                // Filter data by custom date range
                const fromDate = new Date(from)
                const toDate = new Date(to)
                toDate.setHours(23, 59, 59, 999) // Include the entire end date

                data = data.filter(view => {
                    const viewDate = new Date(view.viewedAt)
                    return viewDate >= fromDate && viewDate <= toDate
                })
            } else {
                data = await auditLogsApi.getClerkDocumentViews(range, 30)
            }

            setClerkViews(data)
        } catch (error) {
            console.error('Failed to fetch clerk views:', error)
        } finally {
            setClerkViewsLoading(false)
        }
    }

    const handleCustomDateApply = () => {
        if (customDateFrom && customDateTo) {
            setTimeRange('custom')
            fetchClerkViews('custom', customDateFrom, customDateTo)
            setShowCustomDatePicker(false)
        }
    }

    const loading = docsLoading || (isAdmin ? (auditLoading || assignmentsLoading) : (assignmentsLoading))

    // Prepare data for Pie Chart (Admin only)
    const getDepartmentPieData = () => {
        if (!isAdmin) return []
        return adminDashboardStats || []
    }

    // Prepare Stat Cards
    const getStatCards = () => {
        const cards = []

        if (isAdmin) {
            cards.push(
                {
                    title: t('dashboard.totalActivity'),
                    value: auditStats?.totalActions || 0,
                    icon: Activity,
                    textColor: 'text-purple-600',
                    bgColor: 'bg-purple-50',
                },
                {
                    title: t('dashboard.systemDocuments'),
                    value: statistics?.totalDocuments || 0,
                    icon: FileText,
                    textColor: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                },
                {
                    title: t('dashboard.activeUsers'),
                    value: auditStats?.topUsers?.length || 0,
                    icon: CheckCircle,
                    textColor: 'text-green-600',
                    bgColor: 'bg-green-50',
                },
                {
                    title: t('dashboard.actionTypes'),
                    value: auditStats?.actionsByType?.length || 0,
                    icon: AlertCircle,
                    textColor: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                }
            )
        } else {
            // Manager / Staff view
            cards.push(
                {
                    title: t('dashboard.totalTasks'),
                    value: assignmentStats?.totalAssignments || 0,
                    icon: FileText,
                    textColor: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                },
                {
                    title: t('dashboard.inProgress'),
                    value: assignmentStats?.inProgress || 0,
                    icon: Clock,
                    textColor: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                },
                {
                    title: t('dashboard.pending'),
                    value: assignmentStats?.pending || 0,
                    icon: AlertCircle,
                    textColor: 'text-red-600',
                    bgColor: 'bg-red-50',
                },
                {
                    title: t('dashboard.completed'),
                    value: assignmentStats?.completed || 0,
                    icon: CheckCircle,
                    textColor: 'text-green-600',
                    bgColor: 'bg-green-50',
                }
            )
        }

        return cards
    }

    if (loading && !documents.length && !assignmentStats && !auditStats) {
        return <LoadingSpinner fullPage />
    }

    const statCards = getStatCards()
    const recentActivity = auditStats?.recentActivity || []

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Page header */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                        {t('dashboard.welcome', { name: user?.fullName || 'User' })}
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        {isAdmin ? t('dashboard.adminSubtitle') : t('dashboard.userSubtitle', { department: user?.departmentName || t('common.labels.department') })}
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">{t('dashboard.systemUpdate')}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-200 mt-1">{new Date().toLocaleTimeString()} - {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon
                    const gradientClass = [
                        'from-blue-500/10 via-transparent to-transparent',
                        'from-emerald-500/10 via-transparent to-transparent',
                        'from-amber-500/10 via-transparent to-transparent',
                        'from-rose-500/10 via-transparent to-transparent'
                    ][idx % 4]

                    return (
                        <div key={stat.title} className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none group hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-600/10 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-500 relative overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                            <div className="p-6 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">
                                            {stat.title}
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                                                {stat.value}
                                            </p>
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('dashboard.unit')}</span>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl shadow-md border border-gray-100 dark:border-transparent transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${stat.bgColor.replace('-50', '-100')} dark:${stat.bgColor.replace('bg-', 'bg-').replace('-50', '-900/30')}`}>
                                        <Icon className={`w-6 h-6 ${stat.textColor} dark:${stat.textColor.replace('text-', 'text-').replace('-600', '-400')}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Deadline Alerts Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                        {t('dashboard.deadlineAlerts')}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Incoming Documents */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 shadow-lg shadow-blue-200/20 dark:shadow-none group hover:scale-[1.02] transition-all duration-500 overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
                                    {t('dashboard.totalIncomingDocuments') || 'Tổng số văn bản đến'}
                                </p>
                                <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                                    {isLeader ? (statistics?.incomingDocuments || 0) : (assignmentStats?.totalAssignments || 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/40 rounded-2xl">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="h-1 bg-blue-500 w-full opacity-50" />
                    </div>

                    {/* Overdue */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-red-100 dark:border-red-900/30 shadow-lg shadow-red-200/20 dark:shadow-none group hover:scale-[1.02] transition-all duration-500 overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">
                                    {t('dashboard.overdue')}
                                </p>
                                <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                                    {isLeader ? (statistics?.deadlineStats?.overdue || 0) : (assignmentStats?.deadlineStats?.overdue || 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/40 rounded-2xl">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="h-1 bg-red-500 w-full opacity-50" />
                    </div>

                    {/* Due Today */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-orange-100 dark:border-orange-900/30 shadow-lg shadow-orange-200/20 dark:shadow-none group hover:scale-[1.02] transition-all duration-500 overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">
                                    {t('dashboard.dueToday')}
                                </p>
                                <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                                    {isLeader ? (statistics?.deadlineStats?.dueToday || 0) : (assignmentStats?.deadlineStats?.dueToday || 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/40 rounded-2xl">
                                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <div className="h-1 bg-orange-500 w-full opacity-50" />
                    </div>

                    {/* Nearing */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-yellow-100 dark:border-yellow-900/30 shadow-lg shadow-yellow-200/20 dark:shadow-none group hover:scale-[1.02] transition-all duration-500 overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">
                                    {t('dashboard.nearingDeadline')}
                                </p>
                                <p className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">
                                    {isLeader ? (statistics?.deadlineStats?.nearingDeadline || 0) : (assignmentStats?.deadlineStats?.nearingDeadline || 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-2xl">
                                <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <div className="h-1 bg-yellow-500 w-full opacity-50" />
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-4">
                <div className="lg:col-span-2 card border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <div className="card-header flex justify-between items-center py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary-600 rounded-full" />
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                                {t('dashboard.latestDocuments')}
                            </h3>
                        </div>
                        <Link to="/documents" className="btn btn-secondary py-1.5 text-xs font-bold flex items-center group">
                            {t('common.actions.viewAll')} <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="card-body p-0">
                        {documents.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {documents.slice(0, 5).map((doc) => (
                                    <Link
                                        key={doc.id}
                                        to={`/documents?id=${doc.id}`}
                                        className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group border-b border-gray-100 dark:border-gray-800 last:border-0"
                                    >
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg mr-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {doc.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {doc.createdByName} • {formatDateTime(doc.createdAt)}
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <span className={`badge ${doc.category === 'Incoming' ? 'badge-blue' : 'badge-green'
                                                }`}>
                                                {doc.category === 'Incoming' ? t('documents.incoming') : t('documents.outgoing')}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>{t('documents.noDocuments')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <div className="card-header flex justify-between items-center py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                                {isLeader ? t('dashboard.statistics') : t('assignments.myDepartment')}
                            </h3>
                        </div>
                        {/* {isAdmin && (
                            <Link to="/assignments" className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline">
                                {t('common.actions.viewMore')}
                            </Link>
                        )} */}
                    </div>
                    <div className="card-body p-0">
                        {isLeader ? (
                            <div className="p-4">
                                <DepartmentDocsPieChart data={getDepartmentPieData()} isDarkMode={isDarkMode} />
                            </div>
                        ) : myDepartmentAssignments.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {myDepartmentAssignments.slice(0, 10).map((assignment, idx) => (
                                    <Link key={idx} to="/assignments" className="p-4 block hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 mt-1.5">
                                                <div className={`w-2 h-2 rounded-full shadow-sm ${assignment.status === 'Completed' ? 'bg-green-500 shadow-green-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}></div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-2">
                                                    <span className="font-bold text-gray-900 dark:text-gray-100">{assignment.documentTitle}</span>
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDateTime(assignment.assignedAt)}
                                                    </p>
                                                    <span className={`text-[10px] font-black uppercase tracking-tight py-0.5 px-2 rounded-md ${assignment.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {assignment.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>{t('assignments.noAssignments')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Clerk Document View Tracking - Admin Only */}
            {isAdmin && (
                <div className="card border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <div className="card-header py-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                                    {t('dashboard.clerkViewTracking')}
                                </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* View Mode Toggle */}
                                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
                                    <button
                                        onClick={() => setViewMode('chart')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${viewMode === 'chart'
                                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        <span className="hidden xs:inline">{t('dashboard.chartView')}</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${viewMode === 'table'
                                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Table className="w-3.5 h-3.5" />
                                        <span className="hidden xs:inline">{t('dashboard.tableView')}</span>
                                    </button>
                                </div>

                                {/* Time Range Filter Buttons */}
                                <div className="flex flex-wrap rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
                                    <button
                                        onClick={() => {
                                            setTimeRange('day')
                                            fetchClerkViews('day')
                                            setShowCustomDatePicker(false)
                                        }}
                                        className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all ${timeRange === 'day' && !showCustomDatePicker
                                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                        disabled={clerkViewsLoading}
                                    >
                                        {t('dashboard.today')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTimeRange('week')
                                            fetchClerkViews('week')
                                            setShowCustomDatePicker(false)
                                        }}
                                        className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all ${timeRange === 'week' && !showCustomDatePicker
                                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                        disabled={clerkViewsLoading}
                                    >
                                        {t('dashboard.thisWeek')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTimeRange('month')
                                            fetchClerkViews('month')
                                            setShowCustomDatePicker(false)
                                        }}
                                        className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all ${timeRange === 'month' && !showCustomDatePicker
                                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                        disabled={clerkViewsLoading}
                                    >
                                        {t('dashboard.thisMonth')}
                                    </button>
                                    <button
                                        onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                                        className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all ${(timeRange === 'custom' || showCustomDatePicker)
                                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                        disabled={clerkViewsLoading}
                                    >
                                        {t('dashboard.customRange')}
                                    </button>
                                </div>
                                <button
                                    onClick={() => fetchClerkViews()}
                                    className="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-500 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                                    disabled={clerkViewsLoading}
                                    title={t('common.actions.refresh')}
                                >
                                    <Clock className={`w-4 h-4 ${clerkViewsLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Custom Date Range Picker */}
                        {showCustomDatePicker && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                            {t('dashboard.fromDate')}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={customDateFrom}
                                            onChange={(e) => setCustomDateFrom(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                            {t('dashboard.toDate')}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={customDateTo}
                                            onChange={(e) => setCustomDateTo(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCustomDateApply}
                                        disabled={!customDateFrom || !customDateTo}
                                        className="btn btn-primary py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('common.actions.filter')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="card-body p-6">
                        {clerkViewsLoading ? (
                            <div className="py-12">
                                <LoadingSpinner />
                            </div>
                        ) : clerkViews.length > 0 ? (
                            viewMode === 'chart' ? (
                                <ClerkViewsChart data={clerkViews} isDarkMode={isDarkMode} />
                            ) : (
                                <div className="space-y-4">
                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-4">
                                        {clerkViews.map((view) => (
                                            <div key={view.id} className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                                            {view.clerkName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{view.clerkName}</span>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        <Eye className="w-3 h-3" />
                                                        {t('dashboard.viewed')}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('dashboard.document')}</span>
                                                        <span className="text-xs text-right max-w-[200px] line-clamp-1">
                                                            <Link 
                                                                to={`/documents?id=${view.documentId}`}
                                                                className="text-primary-600 dark:text-primary-400 hover:underline font-bold"
                                                            >
                                                                {view.documentTitle}
                                                            </Link>
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('dashboard.viewTime')}</span>
                                                        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">{formatDateTime(view.viewedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto -mx-6">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>{t('dashboard.clerkName')}</th>
                                                    <th>{t('dashboard.viewedDocument')}</th>
                                                    <th>{t('dashboard.viewTime')}</th>
                                                    <th>{t('common.labels.status')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clerkViews.map((view) => (
                                                    <tr key={view.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="font-medium text-gray-900 dark:text-gray-100">
                                                            {view.clerkName}
                                                        </td>
                                                        <td className="text-gray-700 dark:text-gray-300 max-w-xs">
                                                            <Link 
                                                                to={`/documents?id=${view.documentId}`}
                                                                className="hover:text-primary-600 hover:underline transition-colors font-medium truncate block"
                                                                title={view.documentTitle}
                                                            >
                                                                {view.documentTitle}
                                                            </Link>
                                                        </td>
                                                        <td className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                            {formatDateTime(view.viewedAt)}
                                                        </td>
                                                        <td>
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                <Eye className="w-3 h-3" />
                                                                {t('dashboard.viewed')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>{t('dashboard.noClerkViews')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    )
}

export default DashboardPage
