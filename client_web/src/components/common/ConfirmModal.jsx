import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }) => {
    const { t } = useTranslation()
    if (!isOpen) return null

    const displayConfirmText = confirmText || t('common.actions.confirm')
    const displayCancelText = cancelText || t('common.actions.cancel')

    const typeStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-transparent dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="mt-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3 justify-end">
                        <button onClick={onClose} className="btn btn-secondary">
                            {displayCancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm()
                                onClose()
                            }}
                            className={`btn text-white ${typeStyles[type]}`}
                        >
                            {displayConfirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
