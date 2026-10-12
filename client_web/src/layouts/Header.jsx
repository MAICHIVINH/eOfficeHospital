import { LogOut, Bell, User, ChevronDown, Menu, X, ChevronLeft, Check, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { formatRole } from '../utils/formatters'
import ThemeToggle from '../components/common/ThemeToggle'
import LanguageSwitcher from '../components/common/LanguageSwitcher'
import { useSidebar } from '../store/SidebarContext'
import { useTranslation } from 'react-i18next'
import { useNotifications } from '../store/NotificationContext'

const Header = ({ onMobileMenuToggle, isMobileOpen }) => {
    const { user, logout } = useAuth()
    const { isCollapsed, toggleSidebar } = useSidebar()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const menuRef = useRef(null)
    const notificationRef = useRef(null)

    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false)
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
            toast.success(t('auth.logoutSuccess'))
            navigate('/login')
        } catch (error) {
            toast.error(t('auth.loginFailed'))
        }
    }

    return (
        <header className="h-16 md:h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-3 sm:px-5 md:px-8 sticky top-0 z-40 transition-all duration-500 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                {/* Mobile menu toggle */}
                <button
                    onClick={onMobileMenuToggle}
                    className="md:hidden p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0"
                >
                    {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Desktop sidebar toggle */}
                <button
                    onClick={toggleSidebar}
                    className="hidden md:flex p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0"
                >
                    {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>

                {/* Title — hidden on small mobile */}
                <div className="hidden sm:flex flex-col min-w-0">
                    <h2 className="text-base md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none truncate">
                        {t('header.hospitalName')} <span className="text-primary-600">{t('header.hospitalNameHighlight')}</span>
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1 hidden md:block">{t('header.systemTitle')}</p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative group transition-colors"
                    >
                        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                        <div className="fixed sm:absolute inset-x-4 sm:inset-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-5rem)] flex flex-col">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Thông báo</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                                    >
                                        Đánh dấu đã đọc tất cả
                                    </button>
                                )}
                            </div>

                            {/* Notification List */}
                            <div className="overflow-y-auto flex-1">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Không có thông báo mới</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                                                }`}
                                            onClick={() => {
                                                if (!notification.isRead) {
                                                    markAsRead(notification.id)
                                                }
                                                if (notification.link) {
                                                    navigate(notification.link)
                                                    setIsNotificationOpen(false)
                                                }
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                markAsRead(notification.id)
                                                            }}
                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                            title="Đánh dấu đã đọc"
                                                        >
                                                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteNotification(notification.id)
                                                        }}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User menu dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-1.5 sm:gap-3 pl-2 sm:pl-4 md:pl-6 border-l border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all py-1.5 px-1.5 sm:px-3 rounded-2xl group"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-gray-100 leading-none mb-1.5 max-w-[100px] truncate">
                                {user?.fullName || 'User'}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                {formatRole(user?.role)}
                            </p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-base sm:text-lg shadow-sm border border-primary-100/50 dark:border-primary-800/30 transition-transform group-hover:scale-105">
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-300 transition-all duration-300 hidden sm:block ${isMenuOpen ? 'rotate-180 text-primary-500' : 'group-hover:text-gray-400'}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 sm:hidden">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {user?.fullName || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {formatRole(user?.role)}
                                </p>
                            </div>

                            <Link
                                to="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{t('profile.title')}</span>
                            </Link>

                            <button
                                onClick={() => {
                                    setIsMenuOpen(false)
                                    handleLogout()
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{t('auth.logout')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header
