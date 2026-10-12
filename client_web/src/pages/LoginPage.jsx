import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal'
import VerifyResetCodeModal from '../components/auth/VerifyResetCodeModal'
import ResetPasswordModal from '../components/auth/ResetPasswordModal'
import { forgotPassword, verifyResetCode, resetPassword } from '../api/authApi'

const LoginPage = () => {
    const { t } = useTranslation()
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Forgot password states
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
    const [showVerifyCodeModal, setShowVerifyCodeModal] = useState(false)
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetCode, setResetCode] = useState('')

    const { login, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard')
        }
    }, [isAuthenticated, navigate])

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!credentials.username || !credentials.password) {
            toast.error(t('auth.fillInfo'))
            return
        }

        setIsLoading(true)

        try {
            const result = await login(credentials)

            if (result.type === 'auth/login/fulfilled') {
                toast.success(t('auth.loginSuccess'))
                navigate('/dashboard')
            } else {
                toast.error(result.payload || t('auth.loginFailed'))
            }
        } catch (error) {
            toast.error(t('auth.loginFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    // Forgot password handlers
    const handleForgotPassword = async (email) => {
        try {
            await forgotPassword(email)
            setResetEmail(email)
            toast.success(t('auth.resetCodeSent'))
            setShowForgotPasswordModal(false)
            setShowVerifyCodeModal(true)
        } catch (error) {
            throw new Error(error.response?.data?.message || t('auth.forgotPasswordFailed'))
        }
    }

    const handleVerifyCode = async (code) => {
        try {
            await verifyResetCode(resetEmail, code)
            setResetCode(code)
            toast.success(t('auth.resetCodeVerified'))
            setShowVerifyCodeModal(false)
            setShowResetPasswordModal(true)
        } catch (error) {
            throw new Error(error.response?.data?.message || t('auth.invalidResetCode'))
        }
    }

    const handleResetPassword = async (newPassword) => {
        try {
            await resetPassword(resetEmail, resetCode, newPassword)
            toast.success(t('auth.passwordResetSuccess'))
            setShowResetPasswordModal(false)
            // Reset all states
            setResetEmail('')
            setResetCode('')
        } catch (error) {
            throw new Error(error.response?.data?.message || t('auth.resetPasswordFailed'))
        }
    }

    const handleResendCode = async () => {
        try {
            await forgotPassword(resetEmail)
            toast.success(t('auth.resetCodeSent'))
        } catch (error) {
            throw new Error(error.response?.data?.message || t('auth.forgotPasswordFailed'))
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center transition-colors duration-500 overflow-hidden">
            {/* Blurred Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url("/background.jpg")',
                    filter: 'blur(8px)',
                    transform: 'scale(1.05)' // Slightly scale up to hide blurred edges
                }}
            />

            {/* Overlay to ensure readability */}
            <div className="absolute inset-0 z-10 bg-white/10 dark:bg-black/40" />

            <div className="relative z-20 max-w-md w-full mx-4 sm:mx-0">
                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl dark:shadow-primary-950/20 p-6 sm:p-10 border border-white/50 dark:border-gray-800 transition-all duration-300">
                    {/* Logo & Title */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center mb-4 sm:mb-6 transform transition-transform duration-300">
                            {/* <svg
                                className="w-10 h-10 text-primary-600 dark:text-primary-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg> */}
                            <img src="/logo.jpg" alt="Hospital Logo" className="w-20 sm:w-24 h-auto rounded-lg" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                            {t('auth.systemTitle')}
                        </h1>
                        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {t('auth.systemSubtitle')}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                            <label htmlFor="username" className="form-label text-gray-700 dark:text-gray-300 font-bold ml-1">
                                {t('auth.username')}
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={credentials.username}
                                onChange={handleChange}
                                className="form-input"
                                placeholder={t('auth.usernamePlaceholder')}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="form-label text-gray-700 dark:text-gray-300 font-bold ml-1">
                                {t('auth.password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={credentials.password}
                                    onChange={handleChange}
                                    className="form-input pr-10"
                                    placeholder={t('auth.passwordPlaceholder')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            {/* <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded transition-colors"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {t('auth.rememberMe')}
                                </label>
                            </div> */}

                            <div className="text-sm">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPasswordModal(true)}
                                    className="font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors"
                                >
                                    {t('auth.forgotPassword')}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn btn-primary py-3 sm:py-3.5 flex items-center justify-center gap-3 text-base sm:text-lg shadow-lg shadow-primary-600/30 dark:shadow-primary-950/50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{t('auth.authenticating')}</span>
                                </>
                            ) : (
                                t('auth.loginNow')
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 sm:mt-10 text-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">
                        <p>© 2026 {t('auth.hospitalName')}</p>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modals */}
            <ForgotPasswordModal
                isOpen={showForgotPasswordModal}
                onClose={() => setShowForgotPasswordModal(false)}
                onSuccess={handleForgotPassword}
            />

            <VerifyResetCodeModal
                isOpen={showVerifyCodeModal}
                onClose={() => setShowVerifyCodeModal(false)}
                email={resetEmail}
                onSuccess={handleVerifyCode}
                onResend={handleResendCode}
            />

            <ResetPasswordModal
                isOpen={showResetPasswordModal}
                onClose={() => setShowResetPasswordModal(false)}
                email={resetEmail}
                resetCode={resetCode}
                onSuccess={handleResetPassword}
            />
        </div>
    )
}

export default LoginPage
