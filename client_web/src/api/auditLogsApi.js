import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get audit logs with filters
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getAuditLogs = async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUDIT_LOGS, { params })
    return response.data
}

/**
 * Get audit log by ID
 * @param {string|number} id - Audit log ID
 * @returns {Promise}
 */
export const getAuditLogById = async (id) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.AUDIT_LOGS}/${id}`)
    return response.data
}

/**
 * Get audit logs for a specific user
 * @param {string|number} userId - User ID
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise}
 */
export const getUserAuditLogs = async (userId, limit = 50) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.AUDIT_LOGS}/user/${userId}`, {
        params: { limit }
    })
    return response.data
}

/**
 * Get audit logs for a specific document
 * @param {string|number} documentId - Document ID
 * @returns {Promise}
 */
export const getDocumentAuditLogs = async (documentId) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.AUDIT_LOGS}/document/${documentId}`)
    return response.data
}

/**
 * Get audit statistics
 * @param {Object} params - Query parameters (fromDate, toDate)
 * @returns {Promise}
 */
export const getAuditStatistics = async (params = {}) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.AUDIT_LOGS}/statistics`, { params })
    return response.data
}

/**
 * Get clerk document view logs
 * @param {string} timeRange - Time range filter: 'day', 'week', or 'month'
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise}
 */
export const getClerkDocumentViews = async (timeRange = 'day', limit = 30) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.AUDIT_LOGS}/clerk-views`, {
        params: { timeRange, limit }
    })
    return response.data
}

export default {
    getAuditLogs,
    getAuditLogById,
    getUserAuditLogs,
    getDocumentAuditLogs,
    getAuditStatistics,
    getClerkDocumentViews,
    deleteAuditLog: (id) => axiosInstance.delete(`${API_ENDPOINTS.AUDIT_LOGS}/${id}`),
}
