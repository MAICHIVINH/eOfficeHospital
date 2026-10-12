import { useState, useEffect } from 'react'
import { Upload, FileText, PenLine, FileUp, AlertCircle } from 'lucide-react'
import { createDraft } from '../../api/outgoingWorkflowApi'
import toast from 'react-hot-toast'
import { validateFile, validateRequired } from '../../utils/validators'
import { DOCUMENT_TYPES, SECURITY_LEVELS, DOCUMENT_TYPE_ENUM, SECURITY_LEVEL_ENUM } from '../../utils/constants'
import Modal from '../common/Modal'
import { useTranslation } from 'react-i18next'
import TextEditor, { DOCUMENT_TEMPLATE } from '../common/TextEditor'

const OutgoingDocumentForm = ({ isOpen, onClose, onSuccess, document = null }) => {
    const { t } = useTranslation()

    const initialFormData = {
        name: '',
        type: 'OTHER',
        securityLevel: 'PUBLIC',
        description: '',
        content: DOCUMENT_TEMPLATE
    }

    const [formData, setFormData] = useState(initialFormData)
    const [file, setFile] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState('upload') // 'upload' or 'compose'

    // Load existing document data if provided
    useEffect(() => {
        if (isOpen && document) {
            // Find the relevant assignment to show notes
            const mainAssignment = document.assignments?.find(a => a.assignedToUserId === document.createdById);
            
            setFormData({
                name: document.title || '',
                type: document.documentType?.toUpperCase() || 'OTHER',
                securityLevel: document.securityLevel?.toUpperCase() || 'INTERNAL',
                description: document.description || '',
                content: document.content || DOCUMENT_TEMPLATE,
                assignmentNotes: mainAssignment?.notes || ''
            })
        }
    }, [isOpen, document])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleEditorChange = (content) => {
        setFormData({
            ...formData,
            content: content
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

        // Validation based on mode
        if (mode === 'upload' && !file) {
            toast.error(t('validation.common.required', { field: 'File PDF' }))
            return
        }

        if (mode === 'compose' && (!formData.content || formData.content === DOCUMENT_TEMPLATE)) {
            toast.error(t('validation.common.required', { field: t('common.labels.content') }))
            return
        }

        // Create FormData
        const data = new FormData()
        if (mode === 'upload' && file) {
            data.append('file', file)
        } else {
            data.append('content', formData.content)
        }

        data.append('title', formData.name)
        data.append('description', formData.description)
        data.append('documentType', DOCUMENT_TYPE_ENUM[formData.type] || 0)
        data.append('securityLevel', SECURITY_LEVEL_ENUM[formData.securityLevel] || 0)
        
        if (document?.id) {
            data.append('documentId', document.id)
        }

        setIsLoading(true)

        try {
            const result = await createDraft(data)
            toast.success(t('outgoingWorkflow.messages.draftSuccess'))
            if (onSuccess) {
                onSuccess(result)
            }
            handleClose()
        } catch (error) {
            toast.error(error.response?.data?.message || t('outgoingWorkflow.messages.draftFailed'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('outgoingWorkflow.createDraft')}
            maxWidth={mode === 'compose' ? 'max-w-5xl' : 'max-w-2xl'}
        >
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mb-6 w-fit mx-auto">
                <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'upload'
                            ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <FileUp className="w-4 h-4" />
                    {t('common.actions.upload')}
                </button>
                <button
                    type="button"
                    onClick={() => setMode('compose')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'compose'
                            ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <PenLine className="w-4 h-4" />
                    {t('common.actions.compose')}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Assignment Notes - show if available */}
                {formData.assignmentNotes && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                                {t('assignments.notes')} (Chỉ đạo từ Quản lý)
                            </h4>
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                {formData.assignmentNotes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Mode-specific content */}
                {mode === 'upload' ? (
                    <div>
                        <label className="form-label font-bold">{t('documents.fileName')} PDF <span className="text-red-500">*</span></label>
                        <div className="mt-1 flex justify-center px-4 py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:border-primary-300 dark:hover:border-primary-800 transition-all cursor-pointer relative group">
                            <input
                                id="outgoing-file-upload"
                                type="file"
                                accept=".pdf"
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
                                                <span className="font-bold text-primary-600 dark:text-primary-400">{t('common.actions.upload')}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">PDF (Max 10MB)</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="form-label font-bold mb-2 block">{t('common.labels.content')} <span className="text-red-500">*</span></label>
                        <TextEditor
                            value={formData.content}
                            onChange={handleEditorChange}
                            placeholder={t('common.messages.enterContent')}
                        />
                    </div>
                )}

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
                        <label className="form-label font-bold">{t('documents.documentType')} <span className="text-red-500">*</span></label>
                        <select
                            name="type"
                            required
                            value={formData.type}
                            onChange={handleChange}
                            className="form-select text-sm py-2"
                        >
                            <option value="">-- {t('common.labels.all')} --</option>
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
                            <option value="">-- {t('common.labels.all')} --</option>
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
                        ) : t('outgoingWorkflow.actions.draft')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default OutgoingDocumentForm
