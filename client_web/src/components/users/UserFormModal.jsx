import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Modal from '../common/Modal'
import { createUser, updateUser } from '../../store/usersSlice'
import { selectAllDepartments } from '../../store/departmentsSlice'
import { fetchRoles, selectAllRoles } from '../../store/rolesSlice'
import { ROLES } from '../../utils/constants'
import toast from 'react-hot-toast'

const UserFormModal = ({ isOpen, onClose, user = null, mode = 'create' }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const departments = useSelector(selectAllDepartments)
    const roles = useSelector(selectAllRoles)

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: ROLES.STAFF,
        departmentId: '',
        isActive: true,
    })

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchRoles({ pageSize: 100 }))
        }

        if (user && mode === 'edit') {
            setFormData({
                username: user.username || '',
                password: '', // Never pre-fill password
                fullName: user.fullName || '',
                email: user.email || '',
                role: user.role || ROLES.STAFF,
                departmentId: user.departmentId || '',
                isActive: user.isActive !== false,
            })
        } else {
            // Reset form for create mode
            setFormData({
                username: '',
                password: '',
                fullName: '',
                email: '',
                role: ROLES.STAFF,
                departmentId: '',
                isActive: true,
            })
        }
        setErrors({})
    }, [user, mode, isOpen, dispatch])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.username.trim()) {
            newErrors.username = t('validation.usernameRequired')
        } else if (formData.username.length < 3) {
            newErrors.username = t('validation.minLength', { count: 3 })
        }

        if (mode === 'create' && !formData.password) {
            newErrors.password = t('validation.passwordRequired')
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = t('validation.minLength', { count: 6 })
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = t('validation.fullNameRequired')
        }

        if (!formData.email.trim()) {
            newErrors.email = t('validation.emailRequired')
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
            newErrors.email = t('validation.email')
        }

        if (!formData.role) {
            newErrors.role = t('validation.roleRequired')
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        setIsSubmitting(true)

        try {
            const submitData = { ...formData }
            if (mode === 'edit' && !submitData.password) {
                delete submitData.password
            }
            if (!submitData.departmentId) {
                submitData.departmentId = null
            }

            if (mode === 'create') {
                await dispatch(createUser(submitData)).unwrap()
            } else {
                await dispatch(updateUser({ id: user.id, userData: submitData })).unwrap()
            }

            onClose()
        } catch (error) {
            console.error('Form submission error:', error)
            toast.error(error || t('common.messages.error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? t('users.addUser') : t('users.editUser')}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                    <label className="form-label">
                        {t('common.labels.username')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`form-input ${errors.username ? 'border-red-500' : ''}`}
                        placeholder={t('users.placeholders.username')}
                    />
                    {errors.username && <p className="text-red-500 text-xs mt-1 font-medium">{errors.username}</p>}
                </div>

                {/* Password */}
                {mode === 'create' && (
                    <div>
                        <label className="form-label">
                            {t('common.labels.password')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                            placeholder={t('users.placeholders.password')}
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
                    </div>
                )}

                {/* Full Name */}
                <div>
                    <label className="form-label">
                        {t('users.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`form-input ${errors.fullName ? 'border-red-500' : ''}`}
                        placeholder={t('users.placeholders.fullName')}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="form-label">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="example@hospital.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                </div>

                {/* Role */}
                <div>
                    <label className="form-label">
                        {t('users.role')} <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={`form-select ${errors.role ? 'border-red-500' : ''}`}
                    >
                        <option value="">{t('users.placeholders.selectRole')}</option>
                        {roles.map((role) => {
                            const translationKey = `formatters.role.${role.code}`
                            const translatedName = t(translationKey, { defaultValue: role.name })
                            return (
                                <option key={role.id} value={role.code}>
                                    {translatedName}
                                </option>
                            )
                        })}
                    </select>
                    {errors.role && <p className="text-red-500 text-xs mt-1 font-medium">{errors.role}</p>}
                </div>

                {/* Department */}
                <div>
                    <label className="form-label">{t('common.labels.department')}</label>
                    <select
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleChange}
                        className="form-select"
                    >
                        <option value="">{t('users.placeholders.noDept')}</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-2 py-1">
                    <input
                        type="checkbox"
                        name="isActive"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-primary-500 shadow-sm transition-colors"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        {t('users.activeStatus')}
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-5 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
                        {t('common.actions.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary shadow-lg shadow-primary-600/20" disabled={isSubmitting}>
                        {isSubmitting ? t('common.actions.processing') : mode === 'create' ? t('common.actions.create') : t('common.actions.update')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default UserFormModal
