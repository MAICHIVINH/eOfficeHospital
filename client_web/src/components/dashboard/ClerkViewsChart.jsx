import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { X, Clock, ExternalLink } from 'lucide-react'

/**
 * ClerkViewsChart - Bar chart component for displaying clerk document view statistics
 * @param {Array} data - Array of clerk view records
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
const ClerkViewsChart = ({ data, isDarkMode = false }) => {
    const { t } = useTranslation()
    const [selectedClerk, setSelectedClerk] = useState(null)

    // Transform data for bar chart - group by clerk
    const transformDataForBarChart = () => {
        if (!data || data.length === 0) return []

        // Group views by clerk
        const clerkViewsMap = {}
        data.forEach(view => {
            const clerkName = view.clerkName || 'Unknown'
            if (!clerkViewsMap[clerkName]) {
                clerkViewsMap[clerkName] = {
                    clerkName,
                    viewCount: 0,
                    documents: []
                }
            }
            clerkViewsMap[clerkName].viewCount++
            clerkViewsMap[clerkName].documents.push({
                id: view.documentId,
                title: view.documentTitle || 'Untitled',
                viewedAt: new Date(view.viewedAt)
            })
        })

        // Convert to array and sort by view count
        return Object.values(clerkViewsMap).sort((a, b) => b.viewCount - a.viewCount)
    }

    const chartData = transformDataForBarChart()

    // Premium vibrant color palette
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
        '#f97316', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16', '#a855f7',
    ]

    // Handle bar click
    const handleBarClick = (data) => {
        setSelectedClerk(data)
    }

    // Simple tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            return (
                <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in duration-200">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {item.clerkName}
                    </p>
                    <p className="text-lg font-black text-primary-600 dark:text-primary-400">
                        {item.viewCount} {t('dashboard.views')}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">
                        {t('dashboard.clickToSeeDetails')}
                    </p>
                </div>
            )
        }
        return null
    }

    // Detail Modal
    const DetailModal = () => {
        if (!selectedClerk) return null

        const clerkIndex = chartData.findIndex(c => c.clerkName === selectedClerk.clerkName)
        const color = colors[clerkIndex % colors.length]

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in duration-300">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-4 h-16 rounded-full"
                                    style={{ background: `linear-gradient(to bottom, ${color}, ${color}dd)` }}
                                />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                                        {t('formatters.role.CLERK')}
                                    </p>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                                        {selectedClerk.clerkName}
                                    </h3>
                                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">
                                        {selectedClerk.viewCount} {t('dashboard.viewsDocument')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedClerk(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)] custom-scrollbar">
                        <div className="space-y-3">
                            {[...selectedClerk.documents]
                                .sort((a, b) => b.viewedAt - a.viewedAt)
                                .map((doc, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link 
                                                    to={`/documents?id=${doc.id}`}
                                                    className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                                                >
                                                    <span className="truncate">{doc.title}</span>
                                                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>
                                                        {doc.viewedAt.toLocaleDateString('vi-VN', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            weekday: 'short'
                                                        })}
                                                        {' '}{t('dashboard.at')}{' '}
                                                        {doc.viewedAt.toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Footer */}
                    {/* <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <button
                            onClick={() => setSelectedClerk(null)}
                            className="btn btn-secondary w-full"
                        >
                            Đóng
                        </button>
                    </div> */}
                </div>
            </div>
        )
    }

    if (chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800/50">
                <div className="p-5 bg-white dark:bg-gray-900 rounded-3xl shadow-sm mb-4 border border-gray-100 dark:border-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                </div>
                <p className="text-sm font-bold tracking-tight">{t('common.labels.noData')}</p>
            </div>
        )
    }

    return (
        <>
            <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 0, bottom: 60 }}
                    >
                        <defs>
                            {colors.map((color, index) => (
                                <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                                </linearGradient>
                            ))}
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                            vertical={false}
                        />

                        <XAxis
                            dataKey="clerkName"
                            textAnchor="end"
                            height={80}
                            interval={chartData.length > 10 ? 1 : 0}
                            angle={0}
                            tick={{
                                fill: isDarkMode ? '#f3f4f6' : '#1e293b',
                                fontSize: window.innerWidth < 640 ? 9 : 11,
                                fontWeight: 700
                            }}
                            axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                            tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                        />

                        <YAxis
                            tick={{
                                fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                fontSize: 12,
                                fontWeight: 600
                            }}
                            axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                            tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                            label={{
                                value: t('dashboard.viewsCount'),
                                angle: -90,
                                position: 'insideLeft',
                                style: {
                                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                                    fontSize: 12,
                                    fontWeight: 700
                                }
                            }}
                        />

                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: isDarkMode ? '#1f293720' : '#f1f5f920' }}
                            wrapperStyle={{ outline: 'none' }}
                        />

                        <Bar
                            dataKey="viewCount"
                            radius={[8, 8, 0, 0]}
                            animationDuration={800}
                            animationEasing="ease-out"
                            isAnimationActive={true}
                            onClick={(data) => handleBarClick(data)}
                        >
                            {chartData.map((entry, index) => {
                                const color = colors[index % colors.length]
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#barGradient-${index % colors.length})`}
                                        style={{
                                            filter: `drop-shadow(0 4px 12px ${color}40)`,
                                            cursor: 'pointer'
                                        }}
                                    />
                                )
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detail Modal */}
            <DetailModal />
        </>
    )
}

export default ClerkViewsChart
