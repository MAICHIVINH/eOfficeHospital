import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Modal from '../common/Modal'
import { createDepartment, updateDepartment } from '../../store/departmentsSlice'

const DepartmentFormModal = ({ isOpen, onClose, department = null, mode = 'create' }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        isActive: true,
    })

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (department && mode === 'edit') {
            setFormData({
                name: department.name || '',
                code: department.code || '',
                description: department.description || '',
                isActive: department.isActive !== false,
            })
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
                isActive: true,
            })
        }
        setErrors({})
    }, [department, mode, isOpen])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = t('validation.deptNameRequired')
        }

        if (!formData.code.trim()) {
            newErrors.code = t('validation.deptCodeRequired')
        } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
            newErrors.code = t('validation.deptCodeInvalid')
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
                await dispatch(createDepartment(formData)).unwrap()
            } else {
                await dispatch(updateDepartment({ id: department.id, departmentData: formData })).unwrap()
            }
            onClose()
        } catch (error) {
            console.error('Form submission error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'create' ? t('departments.newDept') : t('departments.editDept')}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="form-label">
                        {t('departments.departmentName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                        placeholder={t('departments.placeholders.name')}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                </div>

                {/* Code */}
                <div>
                    <label className="form-label">
                        {t('departments.departmentCode')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className={`form-input font-mono ${errors.code ? 'border-red-500' : ''}`}
                        placeholder={t('departments.placeholders.code')}
                        style={{ textTransform: 'uppercase' }}
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1 font-medium">{errors.code}</p>}
                    <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-1.5 font-medium italic">
                        {t('departments.codeRequirement')}
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label className="form-label">{t('departments.description')}</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="form-input"
                        placeholder={t('departments.placeholders.description')}
                    />
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
                        {t('departments.activeStatus')}
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

export default DepartmentFormModal
