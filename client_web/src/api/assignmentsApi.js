import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get all assignments (Admin/Manager only)
 * @returns {Promise}
 */
export const getAllAssignments = async () => {
    const response = await axiosInstance.get('/assignments')
    return response.data
}

/**
 * Get assignments for a specific document
 * @param {string|number} documentId - Document ID
 * @returns {Promise}
 */
export const getDocumentAssignments = async (documentId) => {
    const response = await axiosInstance.get(`/assignments/document/${documentId}`)
    return response.data
}

/**
 * Get assignments for current user's department
 * @returns {Promise}
 */
export const getMyDepartmentAssignments = async () => {
    const response = await axiosInstance.get('/assignments/my-department')
    return response.data
}

/**
 * Update assignment status
 * @param {string|number} id - Assignment ID
 * @param {Object|FormData} dto - Status update data or FormData with file
 * @returns {Promise}
 */
export const updateAssignmentStatus = async (id, dto) => {
    const config = {}

    // If dto is FormData, set appropriate headers
    if (dto instanceof FormData) {
        config.headers = {
            'Content-Type': 'multipart/form-data'
        }
    }

    const response = await axiosInstance.put(`/assignments/${id}/status`, dto, config)
    return response.data
}

/**
 * Delete assignment
 * @param {string|number} id - Assignment ID
 * @returns {Promise}
 */
export const deleteAssignment = async (id) => {
    const response = await axiosInstance.delete(`/assignments/${id}`)
    return response.data
}

/**
 * Get department assignment statistics
 * @param {string|number} departmentId - Department ID
 * @returns {Promise}
 */
export const getDepartmentStatistics = async (departmentId) => {
    const response = await axiosInstance.get(`/assignments/department/${departmentId}/statistics`)
    return response.data
}

/**
 * Get aggregated statistics for Admin Dashboard
 * @returns {Promise}
 */
export const getAdminDashboardStats = async () => {
    const response = await axiosInstance.get('/assignments/admin-dashboard-stats')
    return response.data
}

/**
 * Get report file URL for an assignment
 * @param {string|number} id - Assignment ID
 * @returns {Promise}
 */
export const getReportFileUrl = async (id) => {
    const response = await axiosInstance.get(`/assignments/${id}/report`)
    return response.data
}

export default {
    getAllAssignments,
    getDocumentAssignments,
    getMyDepartmentAssignments,
    updateAssignmentStatus,
    deleteAssignment,
    getDepartmentStatistics,
    getAdminDashboardStats,
    getReportFileUrl,
}
