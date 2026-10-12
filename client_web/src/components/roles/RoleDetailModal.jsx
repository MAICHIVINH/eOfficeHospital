import { useTranslation } from 'react-i18next'
import { Shield, Hash, FileText, Calendar } from 'lucide-react'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import { formatDate } from '../../utils/formatters'
import { ROLES } from '../../utils/constants'

const RoleDetailModal = ({ isOpen, onClose, role }) => {
    const { t } = useTranslation()

    if (!role) return null

    const getRoleBadgeVariant = (code) => {
        switch (code) {
            case ROLES.ADMIN: return 'red'
            case ROLES.DIRECTOR: return 'purple'
            case ROLES.CLERK: return 'cyan'
            case ROLES.MANAGER: return 'blue'
            case ROLES.STAFF: return 'green'
            default: return 'gray'
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('roles.roleInfo')}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                {/* Header Information */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border border-indigo-100 dark:border-indigo-800/50">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-lg border border-indigo-200 dark:border-indigo-800 flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                        <Shield size={40} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 truncate">
                            {t(`formatters.role.${role.code}`, { defaultValue: role.name })}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded tracking-widest uppercase">
                                {role.code}
                            </span>
                            <Badge variant={getRoleBadgeVariant(role.code)}>{role.code}</Badge>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                            <FileText size={16} className="group-hover:text-indigo-500 transition-colors" />
                            <span className="text-xs font-bold uppercase tracking-wider">{t('roles.labels.description')}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                            {role.description || t('common.labels.noDescription')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-indigo-300 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Hash size={16} className="group-hover:text-indigo-500 transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('roles.labels.code')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">{role.code}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-indigo-300 transition-colors">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Calendar size={16} className="group-hover:text-indigo-500 transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('common.labels.createdAt')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{formatDate(role.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-primary px-10 shadow-lg shadow-indigo-600/20"
                    >
                        {t('common.actions.close')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default RoleDetailModal
