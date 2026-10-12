import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get all permissions
 * @returns {Promise}
 */
export const getPermissions = async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.PERMISSIONS)
    return response.data
}

/**
 * Get permission by ID
 * @param {string|number} id - Permission ID
 * @returns {Promise}
 */
export const getPermissionById = async (id) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.PERMISSIONS}/${id}`)
    return response.data
}

/**
 * Create new permission
 * @param {Object} dto - Permission data
 * @returns {Promise}
 */
export const createPermission = async (dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.PERMISSIONS, dto)
    return response.data
}

/**
 * Update permission
 * @param {string|number} id - Permission ID
 * @param {Object} dto - Permission data
 * @returns {Promise}
 */
export const updatePermission = async (id, dto) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.PERMISSIONS}/${id}`, dto)
    return response.data
}

/**
 * Delete permission
 * @param {string|number} id - Permission ID
 * @returns {Promise}
 */
export const deletePermission = async (id) => {
    const response = await axiosInstance.delete(`${API_ENDPOINTS.PERMISSIONS}/${id}`)
    return response.data
}

/**
 * Get permission categories
 * @returns {Promise}
 */
export const getPermissionCategories = async () => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.PERMISSIONS}/categories`)
    return response.data
}

export default {
    getPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
    getPermissionCategories,
}
