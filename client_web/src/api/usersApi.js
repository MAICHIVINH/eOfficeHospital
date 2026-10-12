import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get all users
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getUsers = async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.USERS, { params })
    return response.data
}

/**
 * Get user by ID
 * @param {string|number} id - User ID
 * @returns {Promise}
 */
export const getUserById = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.USER_DETAIL(id))
    return response.data
}

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise}
 */
export const createUser = async (userData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.USERS, userData)
    return response.data
}

/**
 * Update user
 * @param {string|number} id - User ID
 * @param {Object} userData - User data
 * @returns {Promise}
 */
export const updateUser = async (id, userData) => {
    const response = await axiosInstance.put(API_ENDPOINTS.USER_DETAIL(id), userData)
    return response.data
}

/**
 * Delete user
 * @param {string|number} id - User ID
 * @returns {Promise}
 */
export const deleteUser = async (id) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.USER_DETAIL(id))
    return response.data
}

/**
 * Change user password (Admin)
 * @param {string|number} id - User ID
 * @param {Object} passwordData - { newPassword }
 * @returns {Promise}
 */
export const changeUserPassword = async (id, passwordData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.USER_CHANGE_PASSWORD(id), passwordData)
    return response.data
}

/**
 * Get users by department
 * @param {string} departmentId - Department ID
 * @returns {Promise}
 */
export const getUsersByDepartment = async (departmentId) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.USERS}/department/${departmentId}`)
    return response.data
}

/**
 * Change own password
 * @param {Object} passwordData - { currentPassword, newPassword }
 * @returns {Promise}
 */
export const changeMyPassword = async (passwordData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.MY_CHANGE_PASSWORD, passwordData)
    return response.data
}

/**
 * Update own profile
 * @param {Object} profileData - { fullName, email }
 * @returns {Promise}
 */
export const updateMyProfile = async (profileData) => {
    const response = await axiosInstance.put(API_ENDPOINTS.MY_PROFILE_UPDATE, profileData)
    return response.data
}

export default {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    getUsersByDepartment,
    changeMyPassword,
    updateMyProfile,
}
