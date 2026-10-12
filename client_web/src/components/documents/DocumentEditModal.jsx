import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
    DOCUMENT_TYPES,
    SECURITY_LEVELS,
    DOCUMENT_TYPE_ENUM,
    SECURITY_LEVEL_ENUM,
    DOCUMENT_CATEGORY,
    FILE_UPLOAD
} from '../../utils/constants'
import { formatDocumentType, formatSecurityLevel } from '../../utils/formatters'
import { validateFile } from '../../utils/validators'
import TextEditor, { DOCUMENT_TEMPLATE } from '../common/TextEditor'
import { getIssuingAgencies } from '../../api/issuingAgenciesApi'

const DocumentEditModal = ({ isOpen, onClose, document, onSave }) => {
    const { t } = useTranslation()
    const [formData, setFormData] = useState({
        title: '',
        documentNumber: '',
        description: '',
        documentType: DOCUMENT_TYPE_ENUM.DIRECTIVE,
        securityLevel: SECURITY_LEVEL_ENUM.PUBLIC,
        content: '',
        issuingAgencyId: ''
    })
    const [selectedFile, setSelectedFile] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState('upload') // 'upload' or 'compose'
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

    useEffect(() => {
        if (document) {
            setFormData({
                title: document.title || '',
                documentNumber: document.documentNumber || '',
                description: document.description || '',
                documentType: typeof document.documentType === 'number'
                    ? document.documentType
                    : (DOCUMENT_TYPE_ENUM[document.documentType?.toUpperCase()] || document.documentType || DOCUMENT_TYPE_ENUM.DIRECTIVE),
                securityLevel: typeof document.securityLevel === 'number'
                    ? document.securityLevel
                    : (SECURITY_LEVEL_ENUM[document.securityLevel?.toUpperCase()] || document.securityLevel || SECURITY_LEVEL_ENUM.PUBLIC),
                content: document.content || '',
                issuingAgencyId: document.issuingAgencyId || ''
            })
            setMode(document.content ? 'compose' : 'upload')
            setSelectedFile(null) // Reset file when document changes
        }
    }, [document])


    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (file) => {
        // Use global validator
        const validation = validateFile(file)
        if (!validation.isValid) {
            alert(validation.message)
            return
        }

        setSelectedFile(file)
    }

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0])
        }
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSave(formData, selectedFile)
            onClose()
        } catch (error) {
            console.error('Error updating document:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container">
                <div className={`modal-content ${mode === 'compose' ? 'max-w-5xl' : 'max-w-2xl'} w-full max-h-[90vh] flex flex-col transition-all duration-300 shadow-2xl border-none outline-none`} onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="card-header flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                            {t('documents.editDocument')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Mode Toggle - Only for Outgoing Documents */}
                    {document?.category === DOCUMENT_CATEGORY.OUTGOING && (
                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mt-4 mx-auto w-fit">
                            <button
                                type="button"
                                onClick={() => setMode('upload')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'upload'
                                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-gray-700'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {t('common.actions.upload')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('compose');
                                    if (!formData.content) {
                                        setFormData(prev => ({ ...prev, content: DOCUMENT_TEMPLATE }));
                                    }
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'compose'
                                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-gray-700'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t('common.actions.compose')}
                            </button>
                        </div>
                    )}

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="card-body space-y-6 overflow-y-auto flex-1">
                        {/* Title */}
                        <div>
                            <label className="form-label">{t('documents.documentName')} *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="form-input"
                                placeholder={t('documents.documentName')}
                            />
                        </div>

                        {document?.category === DOCUMENT_CATEGORY.INCOMING && (
                            <div>
                                <label className="form-label">{t('documents.documentNumber')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.documentNumber}
                                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                    className="form-input"
                                    placeholder={t('documents.documentNumber')}
                                />
                            </div>
                        )}

                        {/* Content Editor for Online Documents */}
                        {mode === 'compose' && (
                            <div>
                                <label className="form-label font-bold mb-2 block">{t('common.labels.content')} *</label>
                                <TextEditor
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    placeholder={t('common.messages.enterContent')}
                                />
                                <p className="text-[10px] text-gray-500 mt-2 italic flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {t('documents.editOnlineContentWarning')}
                                </p>
                            </div>
                        )}

                        {/* File Upload / Current File Info */}
                        {mode === 'upload' && (
                            <>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('documents.currentFile')}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{document.fileName} <span className="whitespace-nowrap">({formatFileSize(document.fileSize)})</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="form-label">{t('documents.replaceFile')}</label>
                                    <div
                                        className={`relative border-2 border-dashed rounded-xl p-2 transition-all ${dragActive
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-300 dark:border-gray-700 hover:border-primary-400'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                                            onChange={handleFileInputChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />

                                        {selectedFile ? (
                                            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[180px] sm:max-w-xs">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                    {t('documents.dragDropFile')}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                                    {t('documents.maxFileSize')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">{t('documents.documentType')} *</label>
                                <select
                                    required
                                    value={formData.documentType}
                                    onChange={(e) => setFormData({ ...formData, documentType: parseInt(e.target.value) })}
                                    className="form-select"
                                >
                                    <option value="">-- {t('documents.documentType')} --</option>
                                    {Object.keys(DOCUMENT_TYPES).map((key) => (
                                        <option key={key} value={DOCUMENT_TYPE_ENUM[key]}>
                                            {t(`formatters.documentType.${key}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Security Level */}
                            <div>
                                <label className="form-label">{t('documents.securityLevel')} *</label>
                                <select
                                    required
                                    value={formData.securityLevel}
                                    onChange={(e) => setFormData({ ...formData, securityLevel: parseInt(e.target.value) })}
                                    className="form-select"
                                >
                                    <option value="">-- {t('documents.securityLevel')} --</option>
                                    {Object.keys(SECURITY_LEVELS).map((key) => (
                                        <option key={key} value={SECURITY_LEVEL_ENUM[key]}>
                                            {t(`formatters.securityLevel.${key}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {document?.category === DOCUMENT_CATEGORY.INCOMING && (
                            <div>
                                <label className="form-label">{t('documents.issuingAgency')}</label>
                                <select
                                    value={formData.issuingAgencyId}
                                    onChange={(e) => setFormData({ ...formData, issuingAgencyId: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="">-- {t('documents.issuingAgency')} --</option>
                                    {agencies.map((agency) => (
                                        <option key={agency.id} value={agency.id}>
                                            {agency.name} ({agency.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}



                        {/* Description */}
                        <div>
                            <label className="form-label">{t('common.labels.description')}</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="form-input min-h-[100px]"
                                placeholder="..."
                            />
                        </div>


                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary flex-1"
                                disabled={loading}
                            >
                                {t('common.actions.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary flex-1"
                                disabled={loading}
                            >
                                {loading ? t('common.labels.loading') : t('common.actions.save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default DocumentEditModal
