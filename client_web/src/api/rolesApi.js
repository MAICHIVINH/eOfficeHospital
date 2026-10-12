import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get all roles
 * @returns {Promise}
 */
export const getRoles = async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ROLES, { params })
    return response.data
}

/**
 * Get role by ID
 * @param {string} id - Role ID
 * @returns {Promise}
 */
export const getRoleById = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ROLE_DETAIL(id))
    return response.data
}

/**
 * Assign permissions to a role
 * @param {string} id - Role ID
 * @param {Array} permissionIds - Array of permission IDs
 * @returns {Promise}
 */
export const assignPermissionsToRole = async (id, permissionIds) => {
    const response = await axiosInstance.post(`${API_ENDPOINTS.ROLES}/${id}/permissions`, { permissionIds })
    return response.data
}

/**
 * Create new role
 * @param {Object} dto - Role data
 * @returns {Promise}
 */
export const createRole = async (dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ROLES, dto)
    return response.data
}

/**
 * Update role
 * @param {string|number} id - Role ID
 * @param {Object} dto - Role data
 * @returns {Promise}
 */
export const updateRole = async (id, dto) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.ROLES}/${id}`, dto)
    return response.data
}

/**
 * Delete role
 * @param {string|number} id - Role ID
 * @returns {Promise}
 */
export const deleteRole = async (id) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.ROLES}/${id}`)
    return response.data
}

/**
 * Get users with this role
 * @param {string|number} id - Role ID
 * @returns {Promise}
 */
export const getRoleUsers = async (id) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.ROLES}/${id}/users`)
    return response.data
}

export default {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionsToRole,
    getRoleUsers,
}
