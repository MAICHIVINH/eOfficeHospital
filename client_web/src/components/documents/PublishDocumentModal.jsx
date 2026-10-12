import { useState, useEffect } from 'react'
import { X, Building2, Globe, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getDepartments } from '../../api/departmentsApi'
import { publishDocument } from '../../api/documentDistributionApi'

const DIST_TYPE = {
    INTERNAL: 0,
    EXTERNAL: 1,
}

const PublishDocumentModal = ({ isOpen, onClose, documentId, onSuccess }) => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState(DIST_TYPE.INTERNAL)
    const [loading, setLoading] = useState(false)
    const [departments, setDepartments] = useState([])
    const [selectedDepts, setSelectedDepts] = useState([])

    // External form
    const [externalName, setExternalName] = useState('')
    const [sentAt, setSentAt] = useState(new Date().toISOString().slice(0, 10))
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadDepartments()
            // Reset
            setSelectedDepts([])
            setExternalName('')
            setNotes('')
            setSentAt(new Date().toISOString().slice(0, 10))
            setActiveTab(DIST_TYPE.INTERNAL)
        }
    }, [isOpen])

    const loadDepartments = async () => {
        try {
            const data = await getDepartments({ pageSize: 100 })
            setDepartments(data.items || data || [])
        } catch {
            setDepartments([])
        }
    }

    const toggleDept = (id) => {
        setSelectedDepts(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (activeTab === DIST_TYPE.INTERNAL && selectedDepts.length === 0) {
            toast.error(t('outgoingWorkflow.distribution.selectDepartments'))
            return
        }
        if (activeTab === DIST_TYPE.EXTERNAL && !externalName.trim()) {
            toast.error(t('outgoingWorkflow.distribution.externalRecipient'))
            return
        }

        setLoading(true)
        try {
            const dto = {
                distributionType: activeTab,
                notes: notes || undefined,
                sentAt: sentAt || undefined,
                ...(activeTab === DIST_TYPE.INTERNAL
                    ? { departmentIds: selectedDepts }
                    : { externalRecipientName: externalName.trim() }),
            }

            await publishDocument(documentId, dto)
            toast.success(t('outgoingWorkflow.historyActions.publishedDocument'))
            onSuccess?.()
            onClose()
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.messages.error'))
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl mx-4 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Send className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('outgoingWorkflow.distribution.title')}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('outgoingWorkflow.distribution.title')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 pt-4 gap-4">
                    <button
                        onClick={() => setActiveTab(DIST_TYPE.INTERNAL)}
                        className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === DIST_TYPE.INTERNAL
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        {t('outgoingWorkflow.distribution.internal')}
                    </button>
                    <button
                        onClick={() => setActiveTab(DIST_TYPE.EXTERNAL)}
                        className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === DIST_TYPE.EXTERNAL
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        {t('outgoingWorkflow.distribution.external')}
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Internal tab */}
                    {activeTab === DIST_TYPE.INTERNAL && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('outgoingWorkflow.distribution.selectDepartments')} <span className="text-red-500">*</span>
                                </label>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto max-h-52 divide-y divide-gray-100 dark:divide-gray-800">
                                    {departments.length === 0 ? (
                                        <p className="text-center text-sm text-gray-400 py-8">{t('common.messages.loading')}...</p>
                                    ) : departments.map(dept => (
                                        <label
                                            key={dept.id}
                                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDepts.includes(dept.id)}
                                                onChange={() => toggleDept(dept.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-800 dark:text-gray-200">{dept.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {selectedDepts.length > 0 && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        {t('common.labels.selected') || 'Đã chọn'} {selectedDepts.length} {t('departments.title')?.toLowerCase() || 'khoa/phòng'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* External tab */}
                    {activeTab === DIST_TYPE.EXTERNAL && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('outgoingWorkflow.distribution.externalRecipient')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={externalName}
                                    onChange={e => setExternalName(e.target.value)}
                                    placeholder={t('outgoingWorkflow.distribution.externalRecipient')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('outgoingWorkflow.distribution.sentAt')}
                                </label>
                                <input
                                    type="date"
                                    value={sentAt}
                                    onChange={e => setSentAt(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Notes - both tabs */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('outgoingWorkflow.distribution.notes')}
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Ghi chú thêm (nếu có)..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-5 py-2 text-sm font-medium rounded-xl text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${
                            activeTab === DIST_TYPE.INTERNAL
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        {loading ? t('common.actions.saving') : t('outgoingWorkflow.actions.publish')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PublishDocumentModal
