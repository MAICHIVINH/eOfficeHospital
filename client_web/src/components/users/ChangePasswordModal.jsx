import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Modal from '../common/Modal'
import { changeUserPassword, changeMyPassword } from '../../store/usersSlice'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, Check, Info } from 'lucide-react'

const ChangePasswordModal = ({ isOpen, onClose, user }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()

    const { user: authUser } = useAuth()
    const isSelf = user?.id === authUser?.id

    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleClose = () => {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPassword(false)
        setErrors({})
        onClose()
    }

    const validate = () => {
        const newErrors = {}

        if (isSelf && !oldPassword) {
            newErrors.oldPassword = t('validation.passwordRequired')
        }

        if (!newPassword) {
            newErrors.newPassword = t('validation.passwordRequired')
        } else if (newPassword.length < 6) {
            newErrors.newPassword = t('validation.minLength', { count: 6 })
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = t('profile.confirmPrompt')
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = t('profile.passwordMismatch')
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        setIsSubmitting(true)

        try {
            if (isSelf) {
                await dispatch(
                    changeMyPassword({
                        oldPassword,
                        newPassword,
                    })
                ).unwrap()
            } else {
                await dispatch(
                    changeUserPassword({
                        id: user.id,
                        passwordData: { newPassword },
                    })
                ).unwrap()
            }
            handleClose()
        } catch (error) {
            console.error('Password change error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' }

        let strength = 0
        if (password.length >= 6) strength++
        if (password.length >= 10) strength++
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
        if (/\d/.test(password)) strength++
        if (/[^a-zA-Z\d]/.test(password)) strength++

        if (strength <= 2) return { strength, label: t('profile.strengthLabels.weak'), color: 'bg-red-500' }
        if (strength <= 3) return { strength, label: t('profile.strengthLabels.medium'), color: 'bg-yellow-500' }
        return { strength, label: t('profile.strengthLabels.strong'), color: 'bg-green-500' }
    }

    const passwordStrength = getPasswordStrength(newPassword)

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('profile.changePassword')} maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 transition-colors">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        {isSelf ? (
                            <span className="font-medium flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                {t('profile.changingYourPassword')}
                            </span>
                        ) : (
                            <span className="flex flex-col gap-1">
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{t('profile.changingPasswordFor')}</span>
                                <strong className="text-base font-black tracking-tight">{user?.fullName}</strong>
                                <span className="text-[10px] italic opacity-75">(@{user?.username})</span>
                            </span>
                        )}
                    </p>
                </div>

                {/* Old Password (only for self) */}
                {isSelf && (
                    <div>
                        <label className="form-label">
                            {t('profile.oldPassword')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => {
                                    setOldPassword(e.target.value)
                                    if (errors.oldPassword) setErrors((prev) => ({ ...prev, oldPassword: '' }))
                                }}
                                className={`form-input pr-10 ${errors.oldPassword ? 'border-red-500' : ''}`}
                                placeholder={t('profile.currentPasswordPlaceholder')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.oldPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.oldPassword}</p>}
                    </div>
                )}

                {/* New Password */}
                <div>
                    <label className="form-label">
                        {t('profile.newPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value)
                                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }))
                            }}
                            className={`form-input pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                            placeholder={t('profile.newPasswordPlaceholder')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.newPassword}</p>}

                    {/* Password Strength Indicator */}
                    {newPassword && (
                        <div className="mt-2 space-y-1.5 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-gray-400 dark:text-gray-500">{t('profile.passwordStrength')}</span>
                                <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${passwordStrength.color} transition-all duration-500`}
                                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="form-label">
                        {t('profile.confirmPassword')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                        }}
                        className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        placeholder={t('profile.confirmPasswordPlaceholder')}
                    />
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2">{t('profile.securityRequirement')}</p>
                    <ul className="text-xs space-y-1.5">
                        <li className="flex items-center gap-2">
                            <Check className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-green-500' : 'text-gray-300 dark:text-gray-700'}`} />
                            <span className={newPassword.length >= 6 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-gray-600'}>
                                {t('validation.minLength', { count: 6 })}
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="mt-0.5 p-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                <Info className="w-3 h-3" />
                            </div>
                            <span className="text-gray-500 dark:text-gray-400 leading-tight">{t('profile.combinationAdvice')}</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-5 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={handleClose} className="btn btn-secondary px-8" disabled={isSubmitting}>
                        {t('common.actions.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary px-10 shadow-lg shadow-primary-600/20" disabled={isSubmitting}>
                        {isSubmitting ? t('common.actions.processing') : t('profile.changePassword')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default ChangePasswordModal
