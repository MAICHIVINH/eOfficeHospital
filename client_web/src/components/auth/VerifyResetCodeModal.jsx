import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import { Clock, RefreshCw } from 'lucide-react'

const VerifyResetCodeModal = ({ isOpen, onClose, email, onSuccess, onResend }) => {
    const { t } = useTranslation()
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [error, setError] = useState('')
    const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
    const inputRefs = useRef([])

    // Countdown timer
    useEffect(() => {
        if (!isOpen) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isOpen])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleClose = () => {
        setCode(['', '', '', '', '', ''])
        setError('')
        setTimeLeft(15 * 60)
        onClose()
    }

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value.slice(-1)
        setCode(newCode)
        setError('')

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6)
        setCode(newCode)
        setError('')

        // Focus last filled input or first empty
        const lastIndex = Math.min(pastedData.length, 5)
        inputRefs.current[lastIndex]?.focus()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const resetCode = code.join('')
        if (resetCode.length !== 6) {
            setError(t('auth.resetCodeInvalid'))
            return
        }

        if (timeLeft === 0) {
            setError(t('auth.resetCodeExpired'))
            return
        }

        setIsSubmitting(true)

        try {
            await onSuccess(resetCode)
            handleClose()
        } catch (err) {
            setError(err.message || t('auth.invalidResetCode'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResendCode = async () => {
        setIsResending(true)
        setError('')

        try {
            await onResend()
            setTimeLeft(15 * 60)
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } catch (err) {
            setError(err.message || t('auth.resendCodeFailed'))
        } finally {
            setIsResending(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('auth.verifyResetCodeTitle')} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        {t('auth.verifyResetCodeSubtitle')}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">{email}</p>
                </div>

                {/* 6-digit code input */}
                <div>
                    <label className="form-label mb-3">{t('auth.resetCode')}</label>
                    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 ${error
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-700 focus:border-primary-500'
                                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors`}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2 font-medium text-center">{error}</p>}
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className={`font-medium ${timeLeft < 60 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                        {t('auth.codeExpiresIn')}: {formatTime(timeLeft)}
                    </span>
                </div>

                {/* Resend code */}
                <div className="text-center">
                    <button
                        type="button"
                        onClick={handleResendCode}
                        className={`text-sm font-medium inline-flex items-center gap-2 transition-colors ${isResending || timeLeft > 14 * 60
                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
                            }`}
                        disabled={isResending || timeLeft > 14 * 60}
                    >
                        <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                        {isResending ? t('common.actions.processing') : t('auth.resendCode')}
                    </button>
                    {timeLeft > 14 * 60 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('auth.resendAvailableIn')} {formatTime(timeLeft - 14 * 60)}
                        </p>
                    )}
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
                        disabled={isSubmitting || code.join('').length !== 6}
                    >
                        {isSubmitting ? t('common.actions.processing') : t('auth.verifyCode')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default VerifyResetCodeModal
