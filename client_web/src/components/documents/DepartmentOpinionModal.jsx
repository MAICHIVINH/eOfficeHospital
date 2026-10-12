import { useState, useEffect } from 'react'
import { Users, Calendar, MessageSquare, Building2, CheckCircle2, Loader2 } from 'lucide-react'
import Modal from '../common/Modal'
import { getDepartments } from '../../api/departmentsApi'
import { requestDepartmentOpinions } from '../../api/outgoingWorkflowApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

/**
 * DepartmentOpinionModal – Quản lý chọn phòng ban & thiết lập thời hạn để gửi yêu cầu lấy ý kiến
 */
const DepartmentOpinionModal = ({ isOpen, onClose, document, onSuccess }) => {
    const { t } = useTranslation()
    const [departments, setDepartments] = useState([])
    const [selectedDeptIds, setSelectedDeptIds] = useState([])
    const [deadline, setDeadline] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchingDepts, setFetchingDepts] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchDepartments()
            setSelectedDeptIds([])
            setNote('')
            // Default deadline: 3 days from now
            const d = new Date()
            d.setDate(d.getDate() + 3)
            setDeadline(d.toISOString().slice(0, 16))
        }
    }, [isOpen])

    const fetchDepartments = async () => {
        setFetchingDepts(true)
        try {
            const data = await getDepartments()
            setDepartments(Array.isArray(data) ? data : data.items || [])
        } catch {
            toast.error('Không thể tải danh sách phòng ban')
        } finally {
            setFetchingDepts(false)
        }
    }

    const toggleDept = (id) => {
        setSelectedDeptIds(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (selectedDeptIds.length === 0) {
            toast.error('Vui lòng chọn ít nhất một phòng ban')
            return
        }
        if (!deadline) {
            toast.error('Vui lòng thiết lập thời hạn phản hồi')
            return
        }

        setLoading(true)
        try {
            await requestDepartmentOpinions(document.id, {
                departmentIds: selectedDeptIds,
                deadline: new Date(deadline).toISOString(),
                note,
            })
            toast.success('Đã gửi yêu cầu lấy ý kiến thành công!')
            onSuccess?.()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gửi yêu cầu thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gửi yêu cầu lấy ý kiến phòng ban"
            maxWidth="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Document info banner */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">Văn bản cần lấy ý kiến</p>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{document?.title}</p>
                    </div>
                </div>

                {/* Department selection */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Chọn phòng ban cần lấy ý kiến
                        <span className="text-red-500">*</span>
                    </label>

                    {fetchingDepts ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                            {departments.map(dept => {
                                const selected = selectedDeptIds.includes(dept.id)
                                return (
                                    <button
                                        key={dept.id}
                                        type="button"
                                        onClick={() => toggleDept(dept.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                                            selected
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                            {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold leading-tight">{dept.name}</p>
                                            {dept.code && <p className="text-[10px] text-gray-400 font-mono">{dept.code}</p>}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {selectedDeptIds.length > 0 && (
                        <p className="mt-2 text-xs text-primary-600 dark:text-primary-400 font-medium">
                            Đã chọn {selectedDeptIds.length} phòng ban
                        </p>
                    )}
                </div>

                {/* Deadline */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Thời hạn phản hồi
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        required
                        className="form-input w-full"
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Ghi chú / Yêu cầu đặc biệt
                    </label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        rows={3}
                        placeholder="Nhập ghi chú gửi kèm cho các phòng ban (tuỳ chọn)..."
                        className="form-input w-full resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={onClose} className="btn btn-secondary">
                        Huỷ
                    </button>
                    <button
                        type="submit"
                        disabled={loading || selectedDeptIds.length === 0}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                        ) : (
                            <><Users className="w-4 h-4" /> Gửi yêu cầu lấy ý kiến</>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default DepartmentOpinionModal
