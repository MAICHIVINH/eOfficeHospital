import { useState, useEffect } from 'react'
import { X, Send, User, Calendar, FileText, AlertCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { getUsers } from '../../api/usersApi'
import { assignDrafting } from '../../api/documentsApi'
import { DOCUMENT_TYPES, SECURITY_LEVEL_ENUM } from '../../utils/constants'
import toast from 'react-hot-toast'

const OutgoingAssignModal = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation()
    const { user } = useSelector((state) => state.auth)
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        documentType: 1,
        securityLevel: SECURITY_LEVEL_ENUM.INTERNAL,
        assignedToUserId: '',
        deadline: '',
        notes: ''
    })

    useEffect(() => {
        if (isOpen) {
            fetchUsers()
        }
    }, [isOpen])

    const fetchUsers = async () => {
        try {
            const params = { pageSize: 100 }
            
            // Managers can only assign to users in their department
            if (user?.role === 'MANAGER' && user?.departmentId) {
                params.departmentId = user.departmentId
            }

            const data = await getUsers(params)
            // Managers cannot assign to themselves
            setUsers((data.items || []).filter(u => u.id !== user?.id))
        } catch (error) {
            console.error('Failed to fetch users:', error)
            setUsers([])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.title || !formData.assignedToUserId) {
            toast.error(t('auth.fillInfo'))
            return
        }

        setLoading(true)
        try {
            await assignDrafting(formData)
            toast.success(t('assignments.assignSuccess'))
            onSuccess()
            onClose()
            setFormData({
                title: '',
                description: '',
                documentType: 1,
                securityLevel: SECURITY_LEVEL_ENUM.INTERNAL,
                assignedToUserId: '',
                deadline: '',
                notes: ''
            })
        } catch (error) {
            toast.error(error.response?.data?.message || t('assignments.assignFailed'))
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/10">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                                {t('outgoingWorkflow.assignModal.assignTitle')}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                {t('documents.documentName')} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    className="form-input w-full pl-11 py-3 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                                    placeholder={t('outgoingWorkflow.assignModal.titlePlaceholder')}
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Document Type */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                    {t('documents.documentType')}
                                </label>
                                <select
                                    className="form-select w-full py-3 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                                    value={formData.documentType}
                                    onChange={(e) => setFormData({ ...formData, documentType: parseInt(e.target.value) })}
                                >
                                    {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
                                        <option key={key} value={key === 'OTHER' ? 99 : Object.keys(DOCUMENT_TYPES).indexOf(key) + 1}>
                                            {t(`formatters.documentType.${key}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assigned User */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                    {t('assignments.assignTo')} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <select
                                        required
                                        className="form-select w-full pl-11 py-3 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                                        value={formData.assignedToUserId}
                                        onChange={(e) => setFormData({ ...formData, assignedToUserId: e.target.value })}
                                    >
                                        <option value="">-- {t('users.placeholders.selectUser')} --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Deadline */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                    {t('assignments.deadline')}
                                </label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                    <input
                                        type="date"
                                        className="form-input w-full pl-11 py-3 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Security Level */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                    {t('documents.securityLevel')}
                                </label>
                                <select
                                    className="form-select w-full py-3 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold"
                                    value={formData.securityLevel}
                                    onChange={(e) => setFormData({ ...formData, securityLevel: parseInt(e.target.value) })}
                                >
                                    <option value={1}>{t('formatters.securityLevel.PUBLIC')}</option>
                                    <option value={2}>{t('formatters.securityLevel.INTERNAL')}</option>
                                    <option value={3}>{t('formatters.securityLevel.CONFIDENTIAL')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                                {t('assignments.notes')}
                            </label>
                            <textarea
                                className="form-textarea w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                                rows="3"
                                placeholder={t('assignments.handlingPlaceholder')}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 mt-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        >
                            {t('common.actions.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary px-8 py-3 rounded-2xl shadow-xl shadow-primary-600/20 flex items-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>{t('common.actions.assign')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default OutgoingAssignModal
