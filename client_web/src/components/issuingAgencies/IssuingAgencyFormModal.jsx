import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Modal from '../common/Modal'
import { createIssuingAgency, updateIssuingAgency } from '../../api/issuingAgenciesApi'
import toast from 'react-hot-toast'

const IssuingAgencyFormModal = ({ isOpen, onClose, agency, mode, onSuccess }) => {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        agencyType: '',
        address: '',
        phoneNumber: '',
        notes: '',
        isActive: true
    })

    useEffect(() => {
        if (agency) {
            setFormData({
                name: agency.name || '',
                code: agency.code || '',
                agencyType: agency.agencyType || '',
                address: agency.address || '',
                phoneNumber: agency.phoneNumber || '',
                notes: agency.notes || '',
                isActive: agency.isActive ?? true
            })
        } else {
            setFormData({
                name: '',
                code: '',
                agencyType: '',
                address: '',
                phoneNumber: '',
                notes: '',
                isActive: true
            })
        }
    }, [agency, isOpen])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            if (mode === 'edit' && agency) {
                await updateIssuingAgency(agency.id, formData)
                toast.success(t('common.messages.updateSuccess'))
            } else {
                await createIssuingAgency(formData)
                toast.success(t('common.messages.createSuccess'))
            }
            if (onSuccess) onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving agency:', error)
            const message = error.response?.data?.message || error.response?.data || t('common.messages.error')
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'view' ? t('common.actions.view') : mode === 'edit' ? t('common.actions.edit') : t('common.actions.add')}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset disabled={mode === 'view'} className="space-y-4 border-none p-0 m-0">
                    <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="form-label font-bold">{t('common.labels.name')} <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="form-input"
                            placeholder={t('common.labels.name')}
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label className="form-label font-bold">{t('common.labels.code')} <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="code"
                            required
                            value={formData.code}
                            onChange={handleChange}
                            className="form-input"
                            placeholder={t('common.labels.code')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="form-label font-bold">{t('common.labels.type')} <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="agencyType"
                            required
                            value={formData.agencyType}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="VD: Cơ quan Nhà nước, Bệnh viện,..."
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label className="form-label font-bold">{t('common.labels.phone')}</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="form-input"
                            placeholder={t('common.labels.phone')}
                        />
                    </div>
                </div>

                <div>
                    <label className="form-label font-bold">{t('common.labels.address')}</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="form-input"
                        placeholder={t('common.labels.address')}
                    />
                </div>

                <div>
                    <label className="form-label font-bold">{t('common.labels.notes')}</label>
                    <textarea
                        name="notes"
                        rows="2"
                        value={formData.notes}
                        onChange={handleChange}
                        className="form-input"
                        placeholder={t('common.labels.notes')}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('departments.active')}
                    </label>
                </div>
                </fieldset>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`btn btn-secondary ${mode === 'view' ? 'w-full' : 'flex-1'}`}
                        disabled={isLoading}
                    >
                        {mode === 'view' ? t('common.actions.close') : t('common.actions.cancel')}
                    </button>
                    {mode !== 'view' && (
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? t('common.labels.loading') : t('common.actions.save')}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    )
}

export default IssuingAgencyFormModal
