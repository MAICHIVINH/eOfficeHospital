import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'

/**
 * DepartmentDocsPieChart - Pie chart component for displaying document statistics by department
 * @param {Array} data - Array of department document statistics
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
const DepartmentDocsPieChart = ({ data, isDarkMode = false }) => {
    const { t } = useTranslation()

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800/50">
                <div className="p-5 bg-white dark:bg-gray-900 rounded-3xl shadow-sm mb-4 border border-gray-100 dark:border-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                </div>
                <p className="text-sm font-bold tracking-tight">{t('common.labels.noData')}</p>
            </div>
        )
    }

    // Premium vibrant color palette
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
        '#f97316', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16', '#a855f7',
    ]

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            return (
                <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in duration-200 min-w-[200px]">
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                        {item.name}
                    </p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{t('documents.incoming')}:</span>
                            <span className="text-sm font-black text-gray-900 dark:text-gray-100">{item.incoming}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('documents.outgoing')}:</span>
                            <span className="text-sm font-black text-gray-900 dark:text-gray-100">{item.outgoing}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">{t('common.labels.all')}:</span>
                            <span className="text-lg font-black text-primary-600 dark:text-primary-400">{item.value}</span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1000}
                        animationEasing="ease-out"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                                stroke="transparent"
                                style={{
                                    filter: `drop-shadow(0 4px 12px ${colors[index % colors.length]}40)`
                                }}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight ml-1">
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

export default DepartmentDocsPieChart
