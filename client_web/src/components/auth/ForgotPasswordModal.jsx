import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import { Mail } from 'lucide-react'

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation()
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleClose = () => {
        setEmail('')
        setError('')
        onClose()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email) {
            setError(t('validation.emailRequired'))
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError(t('validation.invalidFormat'))
            return
        }

        setIsSubmitting(true)

        try {
            await onSuccess(email)
            handleClose()
        } catch (err) {
            setError(err.message || t('auth.forgotPasswordFailed'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('auth.forgotPasswordTitle')} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        {t('auth.forgotPasswordSubtitle')}
                    </p>
                </div>

                <div>
                    <label className="form-label">
                        {t('common.labels.email')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (error) setError('')
                            }}
                            className={`form-input pl-10 ${error ? 'border-red-500' : ''}`}
                            placeholder={t('auth.emailPlaceholder')}
                            autoFocus
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-secondary px-8"
                        disabled={isSubmitting}
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary px-10 shadow-lg shadow-primary-600/20"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('common.actions.processing') : t('auth.sendResetCode')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default ForgotPasswordModal
