import { ROLES, PERMISSIONS } from './constants'

/**
 * Check if user has a specific role
 * @param {Object} user - User object
 * @param {string|string[]} roles - Role or array of roles to check
 * @returns {boolean}
 */
export const hasRole = (user, roles) => {
    if (!user || !user.role) return false

    if (Array.isArray(roles)) {
        return roles.includes(user.role)
    }

    return user.role === roles
}

/**
 * Check if user has a specific permission
 * @param {Object} user - User object
 * @param {string|string[]} permissions - Permission or array of permissions to check
 * @returns {boolean}
 */
export const hasPermission = (user, permissions) => {
    if (!user) return false

    // Admin always has permission
    if (user.role === ROLES.ADMIN) return true

    if (!user.permissions) return false

    if (Array.isArray(permissions)) {
        return permissions.some(permission => user.permissions.includes(permission))
    }

    return user.permissions.includes(permissions)
}

/**
 * Check if user has all specified permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permissions required
 * @returns {boolean}
 */
export const hasAllPermissions = (user, permissions) => {
    if (!user) return false
    if (user.role === ROLES.ADMIN) return true
    if (!user.permissions || !Array.isArray(permissions)) return false

    return permissions.every(permission => user.permissions.includes(permission))
}

/**
 * Check if user can access a specific route
 * @param {Object} user - User object
 * @param {string} route - Route path
 * @returns {boolean}
 */
export const canAccessRoute = (user, route) => {
    if (!user) return false

    // Root/Public routes
    if (route === '/' || route === '/login' || route === '/404') return true

    // Admin can access everything
    if (user.role === ROLES.ADMIN) return true

    // Route-based permission checks
    const routeRequirements = {
        '/dashboard': { roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] },
        '/documents': { permissions: [PERMISSIONS.DOCUMENTS_VIEW] },
        '/assignments': { permissions: [PERMISSIONS.DOCUMENTS_VIEW] },
        '/users': { permissions: [PERMISSIONS.USERS_VIEW] },
        '/departments': { permissions: [PERMISSIONS.DEPARTMENTS_VIEW] },
        '/roles': { permissions: [PERMISSIONS.ROLES_VIEW] },
        '/audit-logs': { permissions: [PERMISSIONS.AUDIT_LOGS_VIEW] },
        '/notification-management': { permissions: [PERMISSIONS.NOTIFICATIONS_VIEW] },
        '/trash': { permissions: [PERMISSIONS.DOCUMENTS_DELETE, PERMISSIONS.USERS_DELETE, PERMISSIONS.DEPARTMENTS_DELETE] }, // Require at least one delete perm
        '/issuing-agencies': { permissions: [PERMISSIONS.ISSUING_AGENCIES_VIEW] },
    }

    const requirement = routeRequirements[route]
    if (!requirement) return true // Allow if not specified

    if (requirement.permissions) {
        return hasPermission(user, requirement.permissions)
    }

    if (requirement.roles) {
        return hasRole(user, requirement.roles)
    }

    return true
}

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export const isAdmin = (user) => {
    return hasRole(user, ROLES.ADMIN)
}

/**
 * Get allowed menu items based on user permissions
 * @param {Object} user - User object
 * @returns {Array} Array of menu groups with items
 */
export const getAllowedMenuItems = (user) => {
    if (!user) return []

    const menuGroups = [
        {
            category: 'sidebar.category.overview',
            items: [
                {
                    path: '/dashboard',
                    label: 'sidebar.menu.dashboard',
                    icon: 'LayoutDashboard',
                },
            ]
        },
        {
            category: 'sidebar.category.documents',
            items: [
                {
                    path: '/documents',
                    label: 'sidebar.menu.incoming_documents',
                    icon: 'FileDown',
                    permission: PERMISSIONS.DOCUMENTS_VIEW,
                },
                {
                    path: '/outgoing-documents',
                    label: 'sidebar.menu.outgoing_documents',
                    icon: 'FileUp',
                    permission: PERMISSIONS.DOCUMENTS_VIEW,
                },
                {
                    path: '/assignments',
                    label: 'sidebar.menu.assignments',
                    icon: 'ClipboardList',
                    permission: PERMISSIONS.DOCUMENTS_VIEW,
                },
                {
                    path: '/incoming-archive',
                    label: 'sidebar.menu.incoming_archive',
                    icon: 'Archive',
                    permission: PERMISSIONS.DOCUMENTS_ARCHIVE,
                },
                {
                    path: '/outgoing-archive',
                    label: 'sidebar.menu.outgoing_archive',
                    icon: 'Archive',
                    permission: PERMISSIONS.DOCUMENTS_ARCHIVE,
                },
            ]
        },
        {
            category: 'sidebar.category.management',
            items: [
                {
                    path: '/users',
                    label: 'sidebar.menu.users',
                    icon: 'Users',
                    permission: PERMISSIONS.USERS_VIEW,
                },
                {
                    path: '/departments',
                    label: 'sidebar.menu.departments',
                    icon: 'LayoutGrid',
                    permission: PERMISSIONS.DEPARTMENTS_VIEW,
                },
                {
                    path: '/issuing-agencies',
                    label: 'sidebar.menu.issuing_agencies',
                    icon: 'Landmark',
                    permission: PERMISSIONS.ISSUING_AGENCIES_VIEW,
                },
            ]
        },
        {
            category: 'sidebar.category.system',
            items: [
                {
                    path: '/roles',
                    label: 'sidebar.menu.roles',
                    icon: 'Shield',
                    permission: PERMISSIONS.ROLES_VIEW,
                },
                {
                    path: '/permissions',
                    label: 'sidebar.menu.permissions',
                    icon: 'ShieldCheck',
                    permission: PERMISSIONS.ROLES_ASSIGN_PERMISSIONS,
                },
                {
                    path: '/audit-logs',
                    label: 'sidebar.menu.auditLogs',
                    icon: 'History',
                    permission: PERMISSIONS.AUDIT_LOGS_VIEW,
                },
                {
                    path: '/notification-management',
                    label: 'sidebar.menu.notificationManagement',
                    icon: 'Bell',
                    permission: PERMISSIONS.NOTIFICATIONS_VIEW,
                },
                {
                    path: '/trash',
                    label: 'sidebar.menu.trash',
                    icon: 'Trash2',
                    permission: [PERMISSIONS.DOCUMENTS_DELETE, PERMISSIONS.USERS_DELETE, PERMISSIONS.DEPARTMENTS_DELETE],
                },
            ]
        },
    ]

    // Filter groups and items based on permissions
    return menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            if (!item.permission) return true
            return hasPermission(user, item.permission)
        })
    })).filter(group => group.items.length > 0) // Only return groups with visible items
}

/**
 * Check if user can perform action on document
 * @param {Object} user - User object
 * @param {Object} document - Document object
 * @param {string} action - Action to perform
 * @returns {boolean}
 */
export const canPerformDocumentAction = (user, document, action) => {
    if (!user) return false

    // Admin can do everything
    if (user.role === ROLES.ADMIN) return true

    switch (action) {
        case 'view':
            return hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)

        case 'create':
        case 'upload':
            return hasPermission(user, PERMISSIONS.DOCUMENTS_UPLOAD)

        case 'edit':
            return hasPermission(user, PERMISSIONS.DOCUMENTS_EDIT)

        case 'delete':
            return hasPermission(user, PERMISSIONS.DOCUMENTS_DELETE)

        case 'assign':
            return hasPermission(user, PERMISSIONS.DOCUMENTS_ASSIGN)

        case 'download':
            // If they can view, they can likely download (backend will enforce if different)
            return hasPermission(user, PERMISSIONS.DOCUMENTS_VIEW)

        default:
            return false
    }
}

