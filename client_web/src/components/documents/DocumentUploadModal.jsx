import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Upload, FileText } from 'lucide-react'
import { uploadDocument, fetchDocuments } from '../../store/documentsSlice'
import toast from 'react-hot-toast'
import { validateFile, validateRequired } from '../../utils/validators'
import { DOCUMENT_TYPES, SECURITY_LEVELS, DOCUMENT_TYPE_ENUM, SECURITY_LEVEL_ENUM } from '../../utils/constants'
import Modal from '../common/Modal'
import { useTranslation } from 'react-i18next'
import { formatDocumentType, formatSecurityLevel } from '../../utils/formatters'
import { getIssuingAgencies } from '../../api/issuingAgenciesApi'

const DocumentUploadModal = ({ isOpen, onClose, onSuccess }) => {
    const dispatch = useDispatch()
    const { t } = useTranslation()

    const initialFormData = {
        name: '',
        documentNumber: '',
        type: '',
        securityLevel: '',
        issueDate: '',
        description: '',
        issuingAgencyId: '',
    }

    const [formData, setFormData] = useState(initialFormData)
    const [file, setFile] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [agencies, setAgencies] = useState([])

    useEffect(() => {
        if (isOpen) {
            fetchAgencies()
        }
    }, [isOpen])

    const fetchAgencies = async () => {
        try {
            const data = await getIssuingAgencies({ activeOnly: true })
            setAgencies(data)
        } catch (error) {
            console.error('Failed to fetch agencies:', error)
        }
    }

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            const validation = validateFile(selectedFile)
            if (!validation.isValid) {
                toast.error(validation.message)
                e.target.value = ''
                return
            }
            setFile(selectedFile)
        }
    }

    const resetForm = () => {
        setFormData(initialFormData)
        setFile(null)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!file) {
            toast.error(t('validation.common.required', { field: t('documents.fileName') }))
            return
        }

        const nameValidation = validateRequired(formData.name, t('documents.documentName'))
        if (!nameValidation.isValid) {
            toast.error(nameValidation.message)
            return
        }

        const typeValidation = validateRequired(formData.type, t('documents.documentType'))
        if (!typeValidation.isValid) {
            toast.error(typeValidation.message)
            return
        }

        const numberValidation = validateRequired(formData.documentNumber, t('documents.documentNumber'))
        if (!numberValidation.isValid) {
            toast.error(numberValidation.message)
            return
        }

        // Create FormData
        const data = new FormData()
        data.append('file', file)
        data.append('title', formData.name)
        data.append('documentNumber', formData.documentNumber)
        data.append('description', formData.description)
        data.append('documentType', DOCUMENT_TYPE_ENUM[formData.type] || 0)
        data.append('securityLevel', SECURITY_LEVEL_ENUM[formData.securityLevel] || 0)
        if (formData.issuingAgencyId) {
            data.append('issuingAgencyId', formData.issuingAgencyId)
        }

        setIsLoading(true)

        try {
            const result = await dispatch(uploadDocument(data))

            if (result.type === 'documents/uploadDocument/fulfilled') {
                toast.success(t('documents.uploadSuccess'))
                if (onSuccess) onSuccess()
                handleClose()
            } else {
                toast.error(result.payload || t('documents.uploadFailed'))
            }
        } catch (error) {
            toast.error(t('documents.uploadFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t('documents.uploadDocument')}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* File upload */}
                <div>
                    <label className="form-label font-bold">{t('documents.fileName')} <span className="text-red-500">*</span></label>
                    <div className="mt-1 flex justify-center px-4 py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:border-primary-300 dark:hover:border-primary-800 transition-all cursor-pointer relative group">
                        <input
                            id="modal-file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            onChange={handleFileChange}
                        />
                        <div className="space-y-2 text-center">
                            {file ? (
                                <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-inner">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 max-w-[250px] truncate">{file.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 shadow-sm mx-auto group-hover:text-primary-500 dark:group-hover:text-primary-400 group-hover:scale-110 transition-all duration-300">
                                        <Upload className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-bold text-primary-600 dark:text-primary-400">{t('documents.dragDropFile')}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t('documents.maxFileSize')}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form fields grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="form-label font-bold">{t('documents.documentName')} <span className="text-red-500">*</span></label>
                        <input
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="form-input text-sm py-2"
                            placeholder={t('documents.documentName')}
                        />
                    </div>

                    <div>
                        <label className="form-label font-bold">{t('documents.documentNumber')} <span className="text-red-500">*</span></label>
                        <input
                            name="documentNumber"
                            type="text"
                            required
                            value={formData.documentNumber}
                            onChange={handleChange}
                            className="form-input text-sm py-2"
                            placeholder={t('documents.documentNumberPlaceholder') || 'Nhập số hiệu văn bản...'}
                        />
                    </div>

                    <div>
                        <label className="form-label font-bold">{t('documents.issuingAgency')}</label>
                        <select
                            name="issuingAgencyId"
                            value={formData.issuingAgencyId}
                            onChange={handleChange}
                            className="form-select text-sm py-2"
                        >
                            <option value="">-- {t('documents.issuingAgency')} --</option>
                            {agencies.map((agency) => (
                                <option key={agency.id} value={agency.id}>
                                    {agency.name} ({agency.code})
                                </option>
                            ))}
                        </select>
                    </div>


                    <div>
                        <label className="form-label font-bold">{t('documents.documentType')} <span className="text-red-500">*</span></label>
                        <select
                            name="type"
                            required
                            value={formData.type}
                            onChange={handleChange}
                            className="form-select text-sm py-2"
                        >
                            <option value="">-- {t('documents.documentType')} --</option>
                            {Object.keys(DOCUMENT_TYPES).map((key) => (
                                <option key={key} value={key}>{t(`formatters.documentType.${key}`)}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label font-bold">{t('documents.securityLevel')}</label>
                        <select
                            name="securityLevel"
                            value={formData.securityLevel}
                            onChange={handleChange}
                            className="form-select text-sm py-2"
                        >
                            <option value="">-- {t('documents.securityLevel')} --</option>
                            {Object.keys(SECURITY_LEVELS).map((key) => (
                                <option key={key} value={key}>{t(`formatters.securityLevel.${key}`)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="form-label font-bold">{t('common.labels.description')}</label>
                    <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="form-input text-sm py-2"
                        placeholder="..."
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-5 border-t border-gray-100 dark:border-gray-800 transition-colors">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-secondary"
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>{t('common.labels.loading')}</span>
                            </>
                        ) : t('common.actions.upload')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default DocumentUploadModal
