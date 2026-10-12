import { useAuth } from './useAuth'
import { hasRole, hasPermission, canAccessRoute } from '../utils/permissions'

/**
 * Custom hook for permission checking
 * @returns {Object} Permission checking methods
 */
export const usePermission = () => {
    const { user } = useAuth()

    const checkRole = (roles) => hasRole(user, roles)

    const checkPermission = (permissions) => hasPermission(user, permissions)

    const checkRouteAccess = (route) => canAccessRoute(user, route)

    return {
        hasRole: checkRole,
        hasPermission: checkPermission,
        canAccessRoute: checkRouteAccess,
        user,
    }
}

export default usePermission
