import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import { createPermission, updatePermission, getPermissionCategories } from '../../api/permissionsApi'
import toast from 'react-hot-toast'

const PermissionFormModal = ({ isOpen, onClose, permission = null, mode = 'create', onSuccess }) => {
    const { t } = useTranslation()

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        category: '',
    })

    const [categories, setCategories] = useState([])
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchCategories()
            if (permission && mode === 'edit') {
                setFormData({
                    name: permission.name || '',
                    code: permission.code || '',
                    description: permission.description || '',
                    category: permission.category || '',
                })
            } else {
                setFormData({
                    name: '',
                    code: 'Permissions.',
                    description: '',
                    category: '',
                })
            }
            setErrors({})
        }
    }, [permission, mode, isOpen])

    const fetchCategories = async () => {
        try {
            const data = await getPermissionCategories()
            setCategories(data || [])
        } catch (error) {
            console.error('Failed to fetch categories', error)
        }
    }

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
        } else if (!formData.code.startsWith('Permissions.')) {
            newErrors.code = t('permissions.validation.codePrefix', { defaultValue: 'Mã quyền phải bắt đầu bằng "Permissions."' })
        }
        if (!formData.category.trim()) {
            newErrors.category = t('validation.required')
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
                await createPermission(formData)
                toast.success(t('common.messages.createSuccess'))
            } else {
                await updatePermission(permission.id, formData)
                toast.success(t('common.messages.updateSuccess'))
            }
            onSuccess()
            onClose()
        } catch (error) {
            const message = error.response?.data?.message || error.message || t('common.messages.error')
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? t('permissions.addPermission', { defaultValue: 'Thêm quyền mới' }) : t('permissions.editPermission', { defaultValue: 'Sửa quyền' })}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="form-label">
                        {t('permissions.labels.name', { defaultValue: 'Tên quyền' })} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                </div>

                <div>
                    <label className="form-label">
                        {t('permissions.labels.code', { defaultValue: 'Mã quyền' })} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className={`form-input ${errors.code ? 'border-red-500' : ''}`}
                        disabled={mode === 'edit'}
                        placeholder="Permissions.Category.Action"
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1 font-medium">{errors.code}</p>}
                </div>

                <div>
                    <label className="form-label">
                        {t('permissions.labels.category', { defaultValue: 'Danh mục' })} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            list="categories-list"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`form-input ${errors.category ? 'border-red-500' : ''}`}
                            placeholder={t('permissions.placeholders.category', { defaultValue: 'Chọn hoặc nhập danh mục mới' })}
                        />
                        <datalist id="categories-list">
                            {categories.map(cat => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>
                    {errors.category && <p className="text-red-500 text-xs mt-1 font-medium">{errors.category}</p>}
                </div>

                <div>
                    <label className="form-label">{t('permissions.labels.description', { defaultValue: 'Mô tả' })}</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="form-input min-h-[80px]"
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

export default PermissionFormModal
