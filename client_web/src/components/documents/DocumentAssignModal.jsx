import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDepartments, selectAllDepartments } from '../../store/departmentsSlice'
import { fetchUsers, selectAllUsers } from '../../store/usersSlice'
import { assignDocumentToDepartments } from '../../store/documentsSlice'
import { ASSIGNMENT_ROLE_ENUM, TOAST_MESSAGES, ROLES, DOCUMENT_CATEGORY, WORKFLOW_STATUS } from '../../utils/constants'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { formatStatus, getInitials } from '../../utils/formatters'
import { Users, User as UserIcon, Building2, Plus, Trash2, Info, CheckCircle2 } from 'lucide-react'
import Modal from '../common/Modal'
import { useAuth } from '../../hooks/useAuth'

const DocumentAssignModal = ({ isOpen, onClose, document, onSuccess }) => {
    const dispatch = useDispatch()
    const { user } = useAuth()
    const departments = useSelector(selectAllDepartments)
    const users = useSelector(selectAllUsers)
    const [selectedAssignments, setSelectedAssignments] = useState([])
    const [activeTab, setActiveTab] = useState('department') // 'department' or 'user'
    const [searchTerm, setSearchTerm] = useState('')
    const [globalDeadline, setGlobalDeadline] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const { t } = useTranslation()

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchDepartments())
            
            // If Manager, only fetch users in their department and hide department tab
            const fetchParams = { pageSize: 100 }
            if (user?.role === ROLES.MANAGER && user?.departmentId) {
                fetchParams.departmentId = user.departmentId
                setActiveTab('user')
            } else {
                setActiveTab('department')
            }
            dispatch(fetchUsers(fetchParams))
            // Initialize with existing assignments
            if (document?.assignments) {
                const initial = document.assignments.map(a => ({
                    departmentId: a.departmentId,
                    assignedToUserId: a.assignedToUserId,
                    role: a.role === 'Main' ? ASSIGNMENT_ROLE_ENUM.MAIN : ASSIGNMENT_ROLE_ENUM.SUPPORT,
                    notes: a.notes || '',
                    deadline: a.deadline ? a.deadline.split('T')[0] : ''
                }))
                setSelectedAssignments(initial)
            } else {
                setSelectedAssignments([])
            }
            if (document?.processingDeadline) {
                setGlobalDeadline(document.processingDeadline.split('T')[0])
            } else {
                setGlobalDeadline('')
            }
        }
    }, [isOpen, document, dispatch, user])

    const handleAddAssignment = (item, type) => {
        const isAlreadySelected = type === 'department'
            ? selectedAssignments.some(a => a.departmentId === item.id)
            : selectedAssignments.some(a => a.assignedToUserId === item.id)

        if (isAlreadySelected) return

        const newAssignment = {
            role: ASSIGNMENT_ROLE_ENUM.SUPPORT, // Default to Support
            notes: '',
            deadline: globalDeadline || (document.processingDeadline ? document.processingDeadline.split('T')[0] : '')
        }

        if (type === 'department') {
            newAssignment.departmentId = item.id
        } else {
            newAssignment.assignedToUserId = item.id
            // If current user is a manager, automatically associate the staff assignment with their department
            if (user?.role === ROLES.MANAGER) {
                newAssignment.departmentId = user.departmentId
            }
        }

        setSelectedAssignments([...selectedAssignments, newAssignment])
    }

    const handleGlobalDeadlineChange = (value) => {
        setGlobalDeadline(value)
        // Optionally update all existing assignments that haven't been manually changed
        // Or just update all of them for simplicity as per common requirement
        setSelectedAssignments(selectedAssignments.map(a => ({
            ...a,
            deadline: value
        })))
    }

    const handleRemoveAssignment = (id, type) => {
        setSelectedAssignments(selectedAssignments.filter(a =>
            type === 'user' ? a.assignedToUserId !== id : a.departmentId !== id
        ))
    }

    const handleUpdateAssignment = (id, type, field, value) => {
        setSelectedAssignments(selectedAssignments.map(a => {
            const match = type === 'user' ? a.assignedToUserId === id : (a.departmentId === id && !a.assignedToUserId)
            return match ? { ...a, [field]: value } : a
        }))
    }

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (selectedAssignments.length === 0) {
            toast.error(t('assignments.selectAtLeastOneDept'))
            return
        }

        if (document.category === DOCUMENT_CATEGORY.INCOMING && 
            document.workflowStatus !== WORKFLOW_STATUS.INCOMING_APPROVED && 
            document.workflowStatus !== WORKFLOW_STATUS.ARCHIVED && 
            document.securityLevel !== 'Public') {
            toast.error(t('documents.messages.waitForApprovalToAssign') || 'Chờ duyệt để phân công')
            return
        }

        try {
            setSubmitting(true)
            await dispatch(assignDocumentToDepartments({
                id: document.id,
                processingDeadline: globalDeadline,
                assignmentData: selectedAssignments
            })).unwrap()

            toast.success(t('assignments.assignSuccess'))
            if (onSuccess) onSuccess()
            onClose()
        } catch (err) {
            toast.error(err || TOAST_MESSAGES.ASSIGN_ERROR)
        } finally {
            setSubmitting(false)
        }
    }

    if (!document) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('assignments.assignToDocument', { title: document.title })}
            maxWidth="max-w-4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3 transition-colors">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-400">
                        <Info className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-bold mb-1">{t('assignments.instructions')}</p>
                        <p className="leading-relaxed">{t('assignments.instructionsDetail')}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Selection List */}
                    <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg mb-4">
                            {user?.role !== ROLES.MANAGER && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('department')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'department' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500'}`}
                                >
                                    <Building2 size={14} />
                                    {t('common.labels.department')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setActiveTab('user')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'user' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                <Users size={14} />
                                {t('users.title')}
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('common.actions.search')}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-1 focus:ring-primary-500"
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>

                        <div className="max-h-[200px] sm:max-h-[350px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {activeTab === 'department' ? (
                                filteredDepartments.map(dept => {
                                    const isSelected = selectedAssignments.some(a => a.departmentId === dept.id && !a.assignedToUserId)
                                    return (
                                        <button
                                            key={dept.id}
                                            type="button"
                                            disabled={isSelected || !dept.isActive}
                                            onClick={() => handleAddAssignment(dept, 'department')}
                                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group
                                                ${isSelected
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 shadow-sm'
                                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-400 dark:hover:border-primary-700 hover:shadow-md'
                                                } ${!dept.isActive && 'opacity-40 cursor-not-allowed'}`}
                                        >
                                            <div className="overflow-hidden">
                                                <p className="font-medium text-sm truncate">{dept.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{dept.code}</p>
                                            </div>
                                            {isSelected ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />}
                                        </button>
                                    )
                                })
                            ) : (
                                filteredUsers.map(u => {
                                    const isSelected = selectedAssignments.some(a => a.assignedToUserId === u.id)
                                    return (
                                        <button
                                            key={u.id}
                                            type="button"
                                            disabled={isSelected || !u.isActive}
                                            onClick={() => handleAddAssignment(u, 'user')}
                                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group
                                                ${isSelected
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 shadow-sm'
                                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-400 dark:hover:border-primary-700 hover:shadow-md'
                                                } ${!u.isActive && 'opacity-40 cursor-not-allowed'}`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {getInitials(u.fullName)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-medium text-sm truncate">{u.fullName}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{u.role}</p>
                                                </div>
                                            </div>
                                            {isSelected ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Right: Selected Assignments Configuration */}
                    <div className="w-full md:w-2/3 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                {t('assignments.selectedCount', { count: selectedAssignments.length })}
                            </h4>

                            {selectedAssignments.length > 0 && (
                                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30 transition-all">
                                    <label className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider whitespace-nowrap">
                                        {t('documents.processingDeadline') || 'Hạn xử lý chung'}:
                                    </label>
                                    <input
                                        type="date"
                                        value={globalDeadline}
                                        onChange={(e) => handleGlobalDeadlineChange(e.target.value)}
                                        className="bg-transparent border-none p-0 text-xs font-bold text-red-700 dark:text-red-400 focus:ring-0 w-32"
                                    />
                                </div>
                            )}
                        </div>

                        {selectedAssignments.length === 0 ? (
                            <div className="h-[180px] sm:h-[400px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 transition-colors">
                                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-4">
                                    <Building2 className="w-12 h-12 opacity-20" />
                                </div>
                                <p className="font-medium">{t('assignments.noSelection')}</p>
                            </div>
                        ) : (
                            <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {selectedAssignments.map((assignment, index) => {
                                    const type = assignment.assignedToUserId ? 'user' : 'department'
                                    const id = assignment.assignedToUserId || assignment.departmentId
                                    const item = type === 'user'
                                        ? users.find(u => u.id === id)
                                        : departments.find(d => d.id === id)

                                    return (
                                        <div key={`${type}-${id}-${index}`} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group animate-in slide-in-from-right-4 duration-300 transition-colors">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAssignment(id, type)}
                                                className="absolute top-4 right-4 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>

                                            <div className="flex items-center gap-3 mb-5 pr-10">
                                                {type === 'department' ? (
                                                    <Building2 className="w-5 h-5 text-primary-500" />
                                                ) : (
                                                    <UserIcon className="w-5 h-5 text-green-500" />
                                                )}
                                                <p className="font-extrabold text-gray-900 dark:text-gray-100 text-lg tracking-tight">
                                                    {type === 'department' ? item?.name : item?.fullName}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 mb-6">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">{t('assignments.handlingRole')}</label>
                                                    <div className="flex bg-gray-50 dark:bg-gray-950 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateAssignment(id, type, 'role', ASSIGNMENT_ROLE_ENUM.MAIN)}
                                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${assignment.role === ASSIGNMENT_ROLE_ENUM.MAIN ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                                        >
                                                            {t('documents.assignmentRoles.main')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateAssignment(id, type, 'role', ASSIGNMENT_ROLE_ENUM.SUPPORT)}
                                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${assignment.role === ASSIGNMENT_ROLE_ENUM.SUPPORT ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                                        >
                                                            {t('documents.assignmentRoles.support')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">{t('assignments.handlingInstructions')}</label>
                                                <textarea
                                                    value={assignment.notes}
                                                    onChange={(e) => handleUpdateAssignment(id, type, 'notes', e.target.value)}
                                                    placeholder={t('assignments.handlingPlaceholder')}
                                                    className="form-input text-sm h-24 bg-gray-50/50 dark:bg-gray-950/50"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 transition-colors">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary w-full sm:w-auto sm:px-8"
                        disabled={submitting}
                    >
                        {t('common.actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary w-full sm:w-auto sm:px-10 shadow-lg shadow-primary-600/20"
                        disabled={submitting || selectedAssignments.length === 0}
                    >
                        {submitting ? t('common.labels.loading') : t('assignments.confirmAssignment')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export default DocumentAssignModal
