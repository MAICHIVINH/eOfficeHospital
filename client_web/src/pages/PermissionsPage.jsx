import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Save, CheckCircle, XCircle, Info, Plus, Edit2, Trash2, Settings, RefreshCcw } from 'lucide-react'
import { getRoles, assignPermissionsToRole } from '../api/rolesApi'
import { getPermissions, deletePermission } from '../api/permissionsApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ConfirmModal from '../components/common/ConfirmModal'
import PermissionFormModal from '../components/permissions/PermissionFormModal'
import useAuth from '../hooks/useAuth'
import toast from 'react-hot-toast'

const PermissionsPage = () => {
    const { t } = useTranslation()
    const { refreshPermissions } = useAuth()
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState([])
    const [matrix, setMatrix] = useState({}) // { roleId: [permId1, permId2] }
    const [originalMatrix, setOriginalMatrix] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Management states
    const [isManageMode, setIsManageMode] = useState(false)
    const [permModalOpen, setPermModalOpen] = useState(false)
    const [permMode, setPermMode] = useState('create')
    const [selectedPerm, setSelectedPerm] = useState(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [permToDelete, setPermToDelete] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [rolesResponse, permissionsData] = await Promise.all([
                getRoles({ pageSize: 100 }), // Get more roles for the matrix
                getPermissions()
            ])
            const rolesData = rolesResponse.items || []
            setRoles(rolesData)
            setPermissions(permissionsData || [])

            // Build initial matrix
            const initialMatrix = {}
            rolesData.forEach(role => {
                initialMatrix[role.id] = role.permissions?.map(p => p.id) || []
            })
            setMatrix(initialMatrix)
            setOriginalMatrix(JSON.parse(JSON.stringify(initialMatrix)))
        } catch (error) {
            toast.error(t('permissions.loadFailed'))
        } finally {
            setLoading(false)
        }
    }

    const togglePermission = (roleId, permissionId) => {
        setMatrix(prev => {
            const currentPerms = prev[roleId] || []
            const newPerms = currentPerms.includes(permissionId)
                ? currentPerms.filter(id => id !== permissionId)
                : [...currentPerms, permissionId]
            return { ...prev, [roleId]: newPerms }
        })
    }

    const toggleCategoryForRole = (roleId, perms, isAllSelected) => {
        const permIds = perms.map(p => p.id)
        setMatrix(prev => {
            const currentPerms = prev[roleId] || []
            let newPerms
            if (isAllSelected) {
                newPerms = currentPerms.filter(id => !permIds.includes(id))
            } else {
                const missingIds = permIds.filter(id => !currentPerms.includes(id))
                newPerms = [...currentPerms, ...missingIds]
            }
            return { ...prev, [roleId]: newPerms }
        })
    }

    const handleSave = async () => {
        const changedRoles = roles.filter(role => {
            const current = JSON.stringify([...(matrix[role.id] || [])].sort())
            const original = JSON.stringify([...(originalMatrix[role.id] || [])].sort())
            return current !== original
        })

        if (changedRoles.length === 0) {
            toast.success(t('common.messages.noChanges'))
            return
        }

        setSaving(true)
        try {
            await Promise.all(changedRoles.map(role =>
                assignPermissionsToRole(role.id, matrix[role.id])
            ))
            toast.success(t('permissions.updateSuccess'))
            setOriginalMatrix(JSON.parse(JSON.stringify(matrix)))
        } catch (error) {
            toast.error(t('permissions.updateFailed'))
        } finally {
            setSaving(false)
        }
    }

    const handleAddPerm = () => {
        setPermMode('create')
        setSelectedPerm(null)
        setPermModalOpen(true)
    }

    const handleEditPerm = (perm) => {
        setPermMode('edit')
        setSelectedPerm(perm)
        setPermModalOpen(true)
    }

    const handleDeleteClick = (perm) => {
        setPermToDelete(perm)
        setDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!permToDelete) return
        try {
            await deletePermission(permToDelete.id)
            toast.success(t('common.messages.deleteSuccess'))
            fetchData()
        } catch (error) {
            const message = error.response?.data?.message || error.message || t('common.messages.error')
            toast.error(message)
        } finally {
            setDeleteModalOpen(false)
            setPermToDelete(null)
        }
    }

    const [isSyncing, setIsSyncing] = useState(false)

    // const handleSync = async () => {
    //     setIsSyncing(true)
    //     try {
    //         await refreshPermissions()
    //         toast.success(t('permissions.syncSuccess', { defaultValue: 'Đồng bộ quyền mới thành công!' }))
    //     } catch (error) {
    //         toast.error(t('permissions.syncFailed', { defaultValue: 'Không thể đồng bộ quyền' }))
    //     } finally {
    //         setIsSyncing(false)
    //     }
    // }

    if (loading) return <LoadingSpinner />

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const categoryKey = perm.category || 'Khác'
        const category = t(`permissions.categories.${categoryKey}`, { defaultValue: categoryKey })
        if (!acc[category]) acc[category] = []
        acc[category].push(perm)
        return acc
    }, {})

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
            <div className="mb-3 flex justify-between items-end flex-shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary flex items-center gap-2 px-6 py-2.5"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        <span className="font-bold tracking-wide">
                            {saving ? t('permissions.saving') : t('permissions.saveChanges')}
                        </span>
                    </button>

                    {/*<button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="btn btn-blue flex items-center gap-2 px-4 py-2.5 shadow-lg shadow-blue-500/20"
                        title={t('permissions.syncTooltip', { defaultValue: 'Cập nhật quyền ngay lập tức mà không cần đăng nhập lại' })}
                    >
                        <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="font-bold tracking-wide">{t('permissions.sync', { defaultValue: 'Đồng bộ' })}</span>
                    </button>*/}

                    <button
                        onClick={() => setIsManageMode(!isManageMode)}
                        className={`btn ${isManageMode ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2 px-4 py-2.5`}
                        title={t('permissions.manageMode', { defaultValue: 'Chế độ quản lý danh mục quyền' })}
                    >
                        <Settings className={`w-4 h-4 ${isManageMode ? 'animate-spin-slow' : ''}`} />
                        <span className="font-bold tracking-wide">{isManageMode ? t('common.actions.finish', { defaultValue: 'Hoàn tất' }) : t('permissions.manage', { defaultValue: 'Quản lý quyền' })}</span>
                    </button>
                </div>

                {isManageMode && (
                    <button
                        onClick={handleAddPerm}
                        className="btn btn-primary flex items-center gap-2 px-5 py-2.5 shadow-lg shadow-primary-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-bold">{t('permissions.add', { defaultValue: 'Thêm quyền' })}</span>
                    </button>
                )}
            </div>

            {/* ── MOBILE CARD VIEW ── */}
            <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-4">
                {roles.map((role) => (
                    <div key={role.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        {/* Role header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-50/30 dark:from-green-900/20 dark:to-transparent border-b border-green-100 dark:border-green-900/30 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{role.name}</p>
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">{role.code}</p>
                            </div>
                        </div>

                        {/* Permissions grouped by category */}
                        <div className="p-3 space-y-3">
                            {Object.entries(groupedPermissions).map(([category, perms]) => {
                                const allSelected = perms.every(p => matrix[role.id]?.includes(p.id))
                                const someSelected = perms.some(p => matrix[role.id]?.includes(p.id))
                                return (
                                    <div key={category}>
                                        {/* Category header row with toggle all */}
                                        <button
                                            onClick={() => toggleCategoryForRole(role.id, perms, allSelected)}
                                            className="w-full flex items-center justify-between mb-1.5 px-1"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">{category}</span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors ${allSelected
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                                : someSelected
                                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                                                }`}>
                                                {allSelected ? t('permissions.deselectAll') : t('permissions.selectAll')}
                                            </span>
                                        </button>
                                        <div className="grid grid-cols-1 gap-1">
                                            {perms.map((perm) => {
                                                const isSelected = matrix[role.id]?.includes(perm.id)
                                                return (
                                                    <div key={perm.id} className="relative group">
                                                        <button
                                                            onClick={() => togglePermission(role.id, perm.id)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${isSelected
                                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                                : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                                                }`}
                                                        >
                                                            {isSelected
                                                                ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                                : <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                                            }
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-xs font-bold truncate ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                    {perm.name}
                                                                </p>
                                                                <code className="text-[9px] text-gray-400 dark:text-gray-500">{perm.code}</code>
                                                            </div>
                                                        </button>
                                                        {isManageMode && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => { e.stopPropagation(); handleEditPerm(perm); }} className="p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded">
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(perm); }} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── DESKTOP TABLE VIEW ── */}
            <div className="hidden md:flex flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex-col">
                <div className="overflow-auto custom-scrollbar flex-1 relative">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-30">
                            {/* Category Headers */}
                            <tr className="bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-md">
                                <th className="sticky left-0 z-40 bg-gray-50 dark:bg-gray-800 border-b-2 border-r-2 border-gray-200 dark:border-gray-700 p-4 text-left min-w-[200px]">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('permissions.roles')}</span>
                                        <span className="text-[10px] text-gray-500 mt-1 font-normal italic">{t('permissions.matrixNote')}</span>
                                    </div>
                                </th>
                                {Object.entries(groupedPermissions).map(([category, perms]) => (
                                    <th
                                        key={category}
                                        colSpan={perms.length}
                                        className="border-b-2 border-r border-gray-200 dark:border-gray-700 p-3 text-center bg-green-50/50 dark:bg-green-900/20"
                                    >
                                        <span className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
                                            {category}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                            {/* Permission Name Headers */}
                            <tr className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                                <th className="sticky left-0 z-40 bg-white dark:bg-gray-900 border-b border-r-2 border-gray-200 dark:border-gray-700" />
                                {permissions.map(perm => (
                                    <th
                                        key={perm.id}
                                        className="border-b border-r border-gray-100 dark:border-gray-800 p-3 min-w-[140px] align-top group"
                                    >
                                        <div className="flex flex-col items-center text-center relative">
                                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-green-600 transition-colors">
                                                {perm.name}
                                            </span>
                                            <code className="mt-1 text-[9px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                                                {perm.code}
                                            </code>

                                            {isManageMode && (
                                                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditPerm(perm)} className="p-1 px-2 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 rounded hover:bg-amber-500 hover:text-white transition-all">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(perm)} className="p-1 px-2 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded hover:bg-rose-500 hover:text-white transition-all">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="sticky left-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 border-b border-r-2 border-gray-200 dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{role.name}</span>
                                            <span className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">{role.code}</span>
                                        </div>
                                    </td>
                                    {permissions.map((perm) => {
                                        const isSelected = matrix[role.id]?.includes(perm.id)
                                        return (
                                            <td
                                                key={`${role.id}-${perm.id}`}
                                                onClick={() => togglePermission(role.id, perm.id)}
                                                className={`border-b border-r border-gray-100 dark:border-gray-800 p-0 text-center cursor-pointer transition-all ${isSelected ? 'bg-green-50/10 dark:bg-green-900/5' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center justify-center w-full h-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        readOnly
                                                        className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 pointer-events-none transition-all transform group-hover:scale-110"
                                                    />
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-blue-50/80 dark:bg-blue-900/10 backdrop-blur-sm border-t border-blue-100 dark:border-blue-900/30 p-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                                <span className="font-bold underline decoration-blue-300 dark:decoration-blue-700 decoration-2 underline-offset-2">{t('permissions.updateNote')}</span>
                                <span className="ml-1">{t('permissions.updateNoteDetail')}</span>
                                <span className="ml-1 opacity-80">{t('permissions.adminNote')}</span>
                            </p>
                        </div>
                        {/* Summary of changes */}
                        <div className="hidden md:flex items-center gap-4 bg-white dark:bg-gray-900 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('permissions.totalRoles')}: {roles.length}</span>
                            <div className="w-px h-3 bg-gray-200 dark:bg-gray-800" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('permissions.totalPermissions')}: {permissions.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <PermissionFormModal
                isOpen={permModalOpen}
                onClose={() => setPermModalOpen(false)}
                permission={selectedPerm}
                mode={permMode}
                onSuccess={fetchData}
            />

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title={t('common.actions.delete')}
                message={t('permissions.confirmDelete', { defaultValue: `Bạn có chắc chắn muốn xóa quyền "${permToDelete?.name}"? Các vai trò đang sở hữu quyền này sẽ bị mất quyền.` })}
                type="danger"
            />
        </div>
    )
}

export default PermissionsPage
