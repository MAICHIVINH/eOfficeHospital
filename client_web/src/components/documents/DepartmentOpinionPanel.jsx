import { useState, useEffect, useCallback } from 'react'
import {
    MessageSquare,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    AlertCircle,
    CornerDownRight,
    Loader2,
    Building2,
    Send
} from 'lucide-react'
import { getDepartmentOpinions, respondDepartmentOpinion } from '../../api/outgoingWorkflowApi'
import { formatDate } from '../../utils/formatters'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

/**
 * DepartmentOpinionPanel - Hiển thị danh sách ý kiến của các phòng ban và cho phép phản hồi
 */
const DepartmentOpinionPanel = ({ documentId, onActionComplete }) => {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [opinions, setOpinions] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [responseComment, setResponseComment] = useState('')

    const fetchOpinions = useCallback(async () => {
        if (!documentId) return
        console.log('Fetching opinions for doc:', documentId)
        setLoading(true)
        try {
            const data = await getDepartmentOpinions(documentId)
            console.log('Received opinions:', data)
            setOpinions(data)
        } catch (error) {
            console.error('Failed to fetch opinions:', error)
            toast.error('Không thể tải danh sách ý kiến')
        } finally {
            setLoading(false)
        }
    }, [documentId])

    useEffect(() => {
        fetchOpinions()
    }, [fetchOpinions])

    const handleRespond = async (isApproved) => {
        if (!isApproved && !responseComment.trim()) {
            toast.error('Vui lòng nhập lý do nếu không đồng ý')
            return
        }

        setSubmitting(true)
        try {
            await respondDepartmentOpinion(documentId, {
                isApproved,
                comment: responseComment
            })
            toast.success(isApproved ? 'Đã gửi ý kiến đồng ý' : 'Đã gửi ý kiến từ chối')
            setResponseComment('')
            fetchOpinions()
            if (onActionComplete) onActionComplete()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể gửi phản hồi')
        } finally {
            setSubmitting(false)
        }
    }

    // Kiểm tra xem user hiện tại có phải là trưởng phòng của một trong các phòng ban đang chờ ý kiến không
    const myOpinion = opinions.find(o => 
        o.departmentId?.toString().toLowerCase() === user?.departmentId?.toString().toLowerCase() && 
        (o.status?.toLowerCase() === 'pending' || o.status === '0')
    )

    const isManager = user?.role?.toUpperCase() === 'MANAGER' || user?.role?.toUpperCase() === 'ADMIN'
    
    console.log('Debug Opinion:', {
        myDeptId: user?.departmentId,
        opinionsDepts: opinions.map(o => o.departmentId),
        myOpinionFound: !!myOpinion,
        userRole: user?.role,
        isManager
    })

    if (loading && opinions.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        )
    }

    // if (opinions.length === 0 && !loading) {
    //     return null
    // }

    return (
        <section className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-orange-500 shadow-lg overflow-hidden">
            <div className="bg-orange-50 dark:bg-orange-900/20 px-5 py-4 border-b border-orange-200 dark:border-orange-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                    Ý kiến các phòng ban
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                        {opinions.filter(o => o.status === 'Approved').length}/{opinions.length} đồng ý
                    </span>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {loading && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                )}

                {!loading && opinions.length === 0 && (
                    <div className="text-center py-6">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 italic">Chưa có yêu cầu lấy ý kiến nào cho văn bản này.</p>
                    </div>
                )}

                {opinions.map((opinion) => (
                    <div key={opinion.id} className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 last:border-l-0 pb-2">
                        {/* Dot on line */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 z-10 flex items-center justify-center ${
                            opinion.status === 'Approved' ? 'border-emerald-500' : 
                            opinion.status === 'Rejected' ? 'border-rose-500' : 'border-orange-500'
                        }`}>
                            {opinion.status === 'Approved' ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> :
                             opinion.status === 'Rejected' ? <XCircle className="w-2.5 h-2.5 text-rose-500" /> :
                             <Clock className="w-2.5 h-2.5 text-orange-500" />}
                        </div>

                        <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                                <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    {opinion.departmentName}
                                    {opinion.status === 'Pending' && (
                                        <span className="text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-black">
                                            Chờ phản hồi
                                        </span>
                                    )}
                                </h5>
                                <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Hạn: {formatDate(opinion.deadline)}
                                    </span>
                                    {opinion.respondedAt && (
                                        <span className="flex items-center gap-1 text-emerald-500">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Đã phản hồi: {formatDate(opinion.respondedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {opinion.comment ? (
                            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                                opinion.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-300' :
                                opinion.status === 'Rejected' ? 'bg-rose-50/50 border-rose-100 text-rose-800 dark:bg-rose-900/10 dark:border-rose-900/30 dark:text-rose-300' :
                                'bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-800/50 dark:border-gray-800 dark:text-gray-400'
                            }`}>
                                <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                    <CornerDownRight className="w-3 h-3" />
                                    <span className="font-bold">{opinion.respondedByName || 'Nội dung ý kiến'}:</span>
                                </div>
                                "{opinion.comment}"
                            </div>
                        ) : opinion.status === 'Pending' ? (
                            <p className="text-xs text-gray-400 italic pl-4">Chưa có ý kiến phản hồi...</p>
                        ) : (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pl-4">Đồng ý (không có ý kiến thêm)</p>
                        )}
                    </div>
                ))}

                {/* Phản hồi của tôi (Nếu là trưởng phòng được yêu cầu) */}
                {myOpinion && isManager && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-5 border border-primary-100 dark:border-primary-900/30">
                            <h5 className="text-sm font-bold text-primary-800 dark:text-primary-300 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Phản hồi ý kiến từ phòng ban bạn
                            </h5>
                            
                            <textarea
                                value={responseComment}
                                onChange={(e) => setResponseComment(e.target.value)}
                                placeholder="Nhập ý kiến hoặc lý do từ chối..."
                                className="form-input w-full bg-white dark:bg-gray-900 border-primary-200 dark:border-primary-800 focus:border-primary-500 min-h-[100px] mb-4 text-sm"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleRespond(true)}
                                    disabled={submitting}
                                    className="flex-1 btn bg-emerald-600 hover:bg-emerald-700 text-white border-none py-2.5 text-sm flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Đồng ý
                                </button>
                                <button
                                    onClick={() => handleRespond(false)}
                                    disabled={submitting}
                                    className="flex-1 btn bg-rose-600 hover:bg-rose-700 text-white border-none py-2.5 text-sm flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Không đồng ý
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default DepartmentOpinionPanel
