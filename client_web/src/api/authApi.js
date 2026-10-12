import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Login user
 * @param {Object} credentials - { username, password }
 * @returns {Promise}
 */
export const login = async (credentials) => {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, credentials)
    return response.data
}

/**
 * Get current user info
 * @returns {Promise}
 */
export const getCurrentUser = async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.ME)
    return response.data
}

/**
 * Refresh current user token and permissions
 * @returns {Promise}
 */
export const refreshToken = async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.REFRESH_TOKEN)
    return response.data
}

/**
 * Send password reset code to email
 * @param {string} email - User email
 * @returns {Promise}
 */
export const forgotPassword = async (email) => {
    const response = await axiosInstance.post(API_ENDPOINTS.FORGOT_PASSWORD, { email })
    return response.data
}

/**
 * Verify password reset code
 * @param {string} email - User email
 * @param {string} resetCode - 6-digit reset code
 * @returns {Promise}
 */
export const verifyResetCode = async (email, resetCode) => {
    const response = await axiosInstance.post(API_ENDPOINTS.VERIFY_RESET_CODE, { email, resetCode })
    return response.data
}

/**
 * Reset password with code
 * @param {string} email - User email
 * @param {string} resetCode - 6-digit reset code
 * @param {string} newPassword - New password
 * @returns {Promise}
 */
export const resetPassword = async (email, resetCode, newPassword) => {
    const response = await axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, { email, resetCode, newPassword })
    return response.data
}

export default {
    login,
    getCurrentUser,
    refreshToken,
    forgotPassword,
    verifyResetCode,
    resetPassword,
}
