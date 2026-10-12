import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Approve incoming document
 * @param {string} id - Document ID
 * @param {Object} data - Transition data (comment)
 * @returns {Promise}
 */
export const approveIncomingDocument = async (id, data = {}) => {
    const response = await axiosInstance.post(API_ENDPOINTS.INCOMING_APPROVE(id), data)
    return response.data
}

/**
 * Reject incoming document
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise}
 */
export const rejectIncomingDocument = async (id, rejectionReason) => {
    const response = await axiosInstance.post(API_ENDPOINTS.INCOMING_REJECT(id), { rejectionReason })
    return response.data
}

/**
 * Archive incoming document
 * @param {string} id - Document ID
 * @param {Object} data - Transition data (comment)
 * @returns {Promise}
 */
export const archiveDocument = async (id, data = {}) => {
    const response = await axiosInstance.post(API_ENDPOINTS.INCOMING_ARCHIVE(id), data)
    return response.data
}

export default {
    approveIncomingDocument,
    rejectIncomingDocument,
    archiveDocument,
}
