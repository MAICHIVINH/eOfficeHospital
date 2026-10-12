import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { X, Upload, FileText } from 'lucide-react'
import Modal from '../common/Modal'
import { updateAssignmentStatus } from '../../store/assignmentsSlice'
import { formatDate, formatRole, formatStatus } from '../../utils/formatters'
import { ASSIGNMENT_STATUS } from '../../utils/constants'
import toast from 'react-hot-toast'

const UpdateAssignmentStatusModal = ({ isOpen, onClose, assignment }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const [status, setStatus] = useState(assignment?.status || 'Pending')
    const [reportFile, setReportFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(t('assignments.fileTooLarge'))
                return
            }
            setReportFile(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setSubmitting(true)

            // Create FormData for file upload
            const formData = new FormData()
            formData.append('status', status === 'Pending' ? '1' : status === 'InProgress' ? '2' : status === 'Completed' ? '3' : '4')

            if (reportFile) {
                formData.append('reportFile', reportFile)
            }

            await dispatch(updateAssignmentStatus({
                id: assignment.id,
                formData
            })).unwrap()

            toast.success(t('assignments.updateSuccess'))
            onClose()
        } catch (err) {
            toast.error(err || t('assignments.updateFailed'))
        } finally {
            setSubmitting(false)
        }
    }

    if (!assignment) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('assignments.updateStatus')} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Assignment Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 transition-colors">
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 truncate">{assignment.documentTitle}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-blue-100/50 dark:border-blue-800/50">
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider block mb-0.5">{t('assignments.role')}</span>
                            <span className="font-bold text-blue-800 dark:text-blue-400">{formatRole(assignment.assignedRole)}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider block mb-0.5">{t('assignments.status')}</span>
                            <span className="font-bold text-blue-800 dark:text-blue-400">{formatStatus(assignment.status)}</span>
                        </div>
                    </div>
                </div>

                {/* Status Selection */}
                <div>
                    <label className="form-label font-bold">
                        {t('assignments.newStatus')} <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value)
                            // Clear file if status is not Completed
                            if (e.target.value !== 'Completed') {
                                setReportFile(null)
                            }
                        }}
                        className="form-select w-full"
                        required
                    >
                        <option value="Pending">{formatStatus('Pending')}</option>
                        <option value="InProgress">{formatStatus('InProgress')}</option>
                        <option value="Completed">{formatStatus('Completed')}</option>
                        <option value="Rejected">{formatStatus('Rejected')}</option>
                    </select>
                </div>

                {/* File Upload (only show when status is Completed) */}
                {status === 'Completed' && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <label className="form-label font-bold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {t('assignments.reportFile')} <span className="text-gray-400 font-normal text-xs">({t('common.labels.optional')})</span>
                        </label>
                        <div className="space-y-3">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                className="hidden"
                                id="report-file-input"
                            />
                            <label
                                htmlFor="report-file-input"
                                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                            >
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {reportFile ? reportFile.name : t('assignments.chooseFile')}
                                </span>
                            </label>
                            {reportFile && (
                                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{reportFile.name}</span>
                                        <span className="text-xs text-gray-400">({(reportFile.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReportFile(null)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('assignments.fileHint')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800 transition-colors">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary px-8"
                        disabled={submitting}
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary px-10 shadow-lg shadow-primary-600/20"
                        disabled={submitting}
                    >
                        {submitting ? t('common.actions.processing') : t('common.actions.update')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default UpdateAssignmentStatusModal
