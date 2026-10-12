import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Modal from '../common/Modal'
import { addRole, editRole } from '../../store/rolesSlice'
import toast from 'react-hot-toast'

const RoleFormModal = ({ isOpen, onClose, role = null, mode = 'create' }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
    })

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (role && mode === 'edit') {
            setFormData({
                name: role.name || '',
                code: role.code || '',
                description: role.description || '',
            })
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
            })
        }
        setErrors({})
    }, [role, mode, isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.name.trim()) {
            newErrors.name = t('validation.required')
        }
        if (!formData.code.trim()) {
            newErrors.code = t('validation.required')
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        setIsSubmitting(true)
        try {
            if (mode === 'create') {
                await dispatch(addRole(formData)).unwrap()
                toast.success(t('roles.messages.createSuccess'))
            } else {
                await dispatch(editRole({ id: role.id, roleData: formData })).unwrap()
                toast.success(t('roles.messages.updateSuccess'))
            }
            onClose()
        } catch (error) {
            toast.error(error || t('common.messages.error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? t('roles.addRole') : t('roles.editRole')}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="form-label">
                        {t('roles.labels.name')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                        placeholder={t('roles.placeholders.name')}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                </div>

                <div>
                    <label className="form-label">
                        {t('roles.labels.code')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className={`form-input ${errors.code ? 'border-red-500' : ''}`}
                        placeholder={t('roles.placeholders.code')}
                        disabled={mode === 'edit'}
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1 font-medium">{errors.code}</p>}
                </div>

                <div>
                    <label className="form-label">{t('roles.labels.description')}</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="form-input min-h-[100px]"
                        placeholder={t('roles.placeholders.description')}
                    />
                </div>

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

export default RoleFormModal
