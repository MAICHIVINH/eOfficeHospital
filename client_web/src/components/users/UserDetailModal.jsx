import { useTranslation } from 'react-i18next'
import { User, Mail, Shield, Building2, Calendar, Hash, Activity } from 'lucide-react'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import { formatDate } from '../../utils/formatters'
import { ROLES } from '../../utils/constants'

const UserDetailModal = ({ isOpen, onClose, user }) => {
    const { t } = useTranslation()

    if (!user) return null

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case ROLES.ADMIN:
                return 'red'
            case ROLES.DIRECTOR:
                return 'purple'
            case ROLES.CLERK:
                return 'cyan'
            case ROLES.MANAGER:
                return 'blue'
            case ROLES.STAFF:
                return 'green'
            default:
                return 'gray'
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('users.userInfo')}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                {/* Header Information */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border border-primary-100 dark:border-primary-800/50">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-lg border border-primary-200 dark:border-primary-800 flex-shrink-0 text-primary-700 dark:text-primary-400 font-bold text-3xl uppercase">
                        {user.fullName?.charAt(0) || user.username?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 truncate">{user.fullName}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">@{user.username}</span>
                            <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            <Badge variant={user.isActive ? 'green' : 'gray'}>
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                    {user.isActive ? t('users.ready') : t('users.absent')}
                                </span>
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-primary-300 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Mail size={16} className="group-hover:text-primary-500 transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('users.email')}</span>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 break-all">{user.email || t('common.labels.noData')}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-primary-300 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Shield size={16} className="group-hover:text-primary-500 transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('users.role')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{user.role}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-primary-300 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Building2 size={16} className="group-hover:text-primary-500 transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('common.labels.department')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{user.department?.name || t('common.labels.none')}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-primary-300 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Calendar size={16} className="group-hover:text-primary-500 transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('common.labels.createdAt')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{formatDate(user.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Additional Stats/Info if any */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                        <Activity size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{t('common.labels.status')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`} />
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {user.isActive ? t('users.activeStatus') : t('users.inactive')}
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-primary px-10 shadow-lg shadow-primary-600/20"
                    >
                        {t('common.actions.close')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default UserDetailModal
