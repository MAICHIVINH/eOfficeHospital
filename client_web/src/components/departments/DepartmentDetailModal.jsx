import { useTranslation } from 'react-i18next'
import { Building2, Calendar, Clock, Hash, Activity } from 'lucide-react'
import Modal from '../common/Modal'
import Badge from '../common/Badge'
import { formatDate } from '../../utils/formatters'

const DepartmentDetailModal = ({ isOpen, onClose, department }) => {
    const { t } = useTranslation()

    if (!department) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('departments.departmentDetail')}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                {/* Header Information */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border border-primary-100 dark:border-primary-800/50">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm border border-primary-200 dark:border-primary-800 flex-shrink-0">
                        <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{department.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-black tracking-widest text-primary-700 dark:text-primary-400 uppercase bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800">
                                {department.code}
                            </span>
                            <Badge variant={department.isActive ? 'green' : 'gray'}>
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${department.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                    {department.isActive ? t('departments.active') : t('departments.inactive')}
                                </span>
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Hash size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('departments.departmentCode')}</span>
                            </div>
                            <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{department.code}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Activity size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('common.labels.status')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                                {department.isActive ? t('departments.active') : t('departments.inactive')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Calendar size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('departments.createdAt')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{formatDate(department.createdAt)}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Clock size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('departments.updatedAt')}</span>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{department.updatedAt ? formatDate(department.updatedAt) : t('common.labels.noData')}</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                        <Building2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{t('departments.description')}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed">
                        {department.description || t('departments.emptyDescription')}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-primary px-8"
                    >
                        {t('common.actions.close')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default DepartmentDetailModal
