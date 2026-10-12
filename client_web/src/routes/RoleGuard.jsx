import { Navigate } from 'react-router-dom'
import { usePermission } from '../hooks/usePermission'

const RoleGuard = ({ children, allowedRoles = [], requiredPermissions = [] }) => {
    const { hasRole, hasPermission, user } = usePermission()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Check roles if provided
    const roleAllowed = allowedRoles.length === 0 || hasRole(allowedRoles)

    // Check permissions if provided
    const permissionAllowed = requiredPermissions.length === 0 || hasPermission(requiredPermissions)

    if (!roleAllowed || !permissionAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300">403</h1>
                    <p className="mt-4 text-xl text-gray-600">Bạn không có quyền truy cập trang này</p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 btn btn-primary"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    return children
}

export default RoleGuard

