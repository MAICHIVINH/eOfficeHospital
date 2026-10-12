import { useEffect, useState } from 'react'
import { User, Mail, Shield, Building2, Calendar, Edit, Key } from 'lucide-react'
import { getCurrentUser } from '../api/authApi'
import { updateMyProfile, changeMyPassword } from '../api/usersApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import { formatRole } from '../utils/formatters'
import { ROLES } from '../utils/constants'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const ProfilePage = () => {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const { t } = useTranslation()

    // Form states
    const [editForm, setEditForm] = useState({ fullName: '', email: '' })
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const data = await getCurrentUser()
            setProfile(data)
            setEditForm({
                fullName: data.fullName || '',
                email: data.email || ''
            })
        } catch (error) {
            toast.error(t('profile.loadProfileFailed'))
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await updateMyProfile(editForm)
            toast.success(t('profile.profileUpdateSuccess'))
            setIsEditModalOpen(false)
            fetchProfile()
        } catch (error) {
            toast.error(error.response?.data?.message || t('profile.profileUpdateFailed'))
        } finally {
            setSubmitting(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return toast.error(t('profile.passwordMismatch'))
        }
        if (passwordForm.newPassword.length < 6) {
            return toast.error(t('profile.passwordTooShort'))
        }

        setSubmitting(true)
        try {
            await changeMyPassword({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            })
            toast.success(t('profile.passwordChangeSuccess'))
            setIsPasswordModalOpen(false)
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error) {
            toast.error(error.response?.data?.message || t('profile.passwordChangeFailed'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t('profile.userNotFound')}</p>
            </div>
        )
    }

    const getRoleBadgeVariant = (role) => {
        if (!role) return 'gray'

        // Normalize role for comparison (handle both codes and Vietnamese names)
        const r = role.toUpperCase().trim()

        if (r === ROLES.ADMIN || r === 'QUẢN TRỊ VIÊN') return 'red'
        if (r === ROLES.DIRECTOR || r === 'BAN GIÁM ĐỐC') return 'purple'
        if (r === ROLES.CLERK || r === 'VĂN THƯ') return 'cyan'
        if (r === ROLES.MANAGER || r === 'QUẢN LÝ') return 'blue'
        if (r === ROLES.STAFF || r === 'NHÂN VIÊN') return 'green'

        return 'gray'
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            {/*<div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('profile.title')}</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('profile.subtitle')}</p>
            </div>*/}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-16 mb-4">
                                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-white bg-primary-100 text-primary-600 shadow-sm overflow-hidden">
                                    <span className="text-4xl font-bold">
                                        {profile.fullName?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.fullName}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{profile.username}</p>
                            <Badge variant={getRoleBadgeVariant(profile.role)} className="px-4 py-1">
                                {formatRole(profile.role)}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('profile.personalInfo')}</h3>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                <span>{t('common.actions.edit')}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <User className="w-4 h-4" />
                                    <span>{t('common.labels.fullName')}</span>
                                </label>
                                <p className="text-gray-900 dark:text-gray-100 font-medium">{profile.fullName}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <Mail className="w-4 h-4" />
                                    <span>{t('common.labels.email')}</span>
                                </label>
                                <p className="text-gray-900 dark:text-gray-100 font-medium">{profile.email || 'N/A'}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <Building2 className="w-4 h-4" />
                                    <span>{t('common.labels.department')}</span>
                                </label>
                                <p className="text-gray-900 dark:text-gray-100 font-medium">{profile.department?.name || 'N/A'}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <Shield className="w-4 h-4" />
                                    <span>{t('common.labels.role')}</span>
                                </label>
                                <p className="text-gray-900 dark:text-gray-100 font-medium">{formatRole(profile.role)}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>{t('profile.joinedDate')}</span>
                                </label>
                                <p className="text-gray-900 dark:text-gray-100 font-medium">
                                    {profile.createdAt ? format(new Date(profile.createdAt), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('profile.security')}</h3>
                        </div>
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-medium"
                        >
                            <Key className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <span>{t('profile.changePassword')}</span>
                        </button>
                    </div>

                    {/* Edit Profile Modal */}
                    <Modal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        title={t('profile.editProfile')}
                        maxWidth="max-w-md"
                    >
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('common.labels.fullName')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('common.labels.email')}
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                                >
                                    {t('common.actions.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {submitting ? t('profile.saving') : t('common.actions.save')}
                                </button>
                            </div>
                        </form>
                    </Modal>

                    {/* Change Password Modal */}
                    <Modal
                        isOpen={isPasswordModalOpen}
                        onClose={() => setIsPasswordModalOpen(false)}
                        title={t('profile.changePassword')}
                        maxWidth="max-w-md"
                    >
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.oldPassword')}
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                                    value={passwordForm.oldPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.newPassword')}
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('profile.confirmPassword')}
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                                >
                                    {t('common.actions.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {submitting ? t('profile.updating') : t('profile.changePassword')}
                                </button>
                            </div>
                        </form>
                    </Modal>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
