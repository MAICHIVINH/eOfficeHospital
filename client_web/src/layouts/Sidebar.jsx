import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, ClipboardList, Users, Building2, History, Shield, ShieldCheck, FileDown, FileUp, Trash2, Bell, X, Archive, Landmark, LayoutGrid } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getAllowedMenuItems } from '../utils/permissions'
import { useSidebar } from '../store/SidebarContext'
import { useTranslation } from 'react-i18next'

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
    const { user } = useAuth()
    const { isCollapsed } = useSidebar()
    const { t } = useTranslation()

    const iconMap = {
        LayoutDashboard,
        FileText,
        ClipboardList,
        Users,
        Building2,
        History,
        Shield,
        ShieldCheck,
        FileDown,
        FileUp,
        Trash2,
        Bell,
        Archive,
        Landmark,
        LayoutGrid,
    }

    const menuItems = getAllowedMenuItems(user)

    return (
        <>
            {/* Desktop sidebar */}
            <aside className={`
                hidden md:flex flex-col
                ${isCollapsed ? 'w-20' : 'w-72'}
                bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-900
                transition-all duration-500 z-30 flex-shrink-0
            `}>
                {/* Logo area */}
                <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-8'} border-b border-gray-50 dark:border-gray-900 overflow-hidden`}>
                    <div className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 flex-shrink-0">
                            <img src="/logosidebar.png" alt="" />
                        </div>
                        {!isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-500 whitespace-nowrap">
                                <span className="block text-base font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{t('sidebar.hospitalName')}</span>
                                <span className="block text-[10px] font-bold text-primary-600 dark:text-primary-500 uppercase tracking-widest mt-0.5">{t('sidebar.hospitalSubname')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 overflow-y-auto custom-scrollbar`}>
                    <SidebarMenu menuItems={menuItems} iconMap={iconMap} isCollapsed={isCollapsed} t={t} onItemClick={null} />
                </nav>

                {/* Footer */}
                <SidebarFooter isCollapsed={isCollapsed} t={t} />
            </aside>

            {/* Mobile sidebar (drawer) */}
            <aside className={`
                md:hidden fixed inset-y-0 left-0 z-50 w-72
                bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-900
                flex flex-col transition-transform duration-300
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo area with close button */}
                <div className="h-20 flex items-center px-5 border-b border-gray-50 dark:border-gray-900">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <img src="/logosidebar.png" alt="" className="w-10 h-10 object-contain" />
                        </div>
                        <div className="whitespace-nowrap min-w-0">
                            <span className="block text-sm font-black text-gray-900 dark:text-gray-100 leading-tight tracking-tight truncate">{t('sidebar.hospitalName')}</span>
                            <span className="block text-[10px] font-bold text-primary-600 dark:text-primary-500 uppercase tracking-widest mt-0.5">{t('sidebar.hospitalSubname')}</span>
                        </div>
                    </div>
                    <button
                        onClick={onMobileClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
                    <SidebarMenu menuItems={menuItems} iconMap={iconMap} isCollapsed={false} t={t} onItemClick={onMobileClose} />
                </nav>

                {/* Footer */}
                <SidebarFooter isCollapsed={false} t={t} />
            </aside>
        </>
    )
}

const SidebarMenu = ({ menuItems, iconMap, isCollapsed, t, onItemClick }) => (
    <>
        {menuItems.map((group, groupIndex) => (
            <div key={groupIndex} className={groupIndex > 0 ? 'mt-6' : ''}>
                {/* Category Label */}
                {!isCollapsed && (
                    <div className="px-5 mb-2">
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-600 uppercase tracking-widest">
                            {t(group.category)}
                        </span>
                    </div>
                )}

                {/* Category Divider for collapsed state */}
                {isCollapsed && groupIndex > 0 && (
                    <div className="my-3 px-2">
                        <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
                    </div>
                )}

                {/* Menu Items */}
                <div className="space-y-1">
                    {group.items.map((item) => {
                        const Icon = iconMap[item.icon]
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                title={isCollapsed ? t(item.label) : ''}
                                onClick={onItemClick}
                                className={({ isActive }) =>
                                    `flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-5'} py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                        ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20 font-bold scale-[1.02]'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-primary-600 dark:hover:text-primary-400 font-medium'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {Icon && <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0`} />}
                                        {!isCollapsed && (
                                            <span className="tracking-tight whitespace-nowrap">{t(item.label)}</span>
                                        )}
                                        {!isCollapsed && isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        )
                    })}
                </div>
            </div>
        ))}
    </>
)

const SidebarFooter = ({ isCollapsed, t }) => (
    <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-t border-gray-50 dark:border-gray-900 transition-all duration-500`}>
        <div className={`bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl ${isCollapsed ? 'p-2' : 'p-4'} border border-gray-100 dark:border-gray-800/50 overflow-hidden`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-500" />
                </div>
                {!isCollapsed && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-500 whitespace-nowrap">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">{t('sidebar.developer')}</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-200">{t('sidebar.developerName')}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
)

export default Sidebar
