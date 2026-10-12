import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Create a new draft outgoing document
 * @param {FormData} formData - Form data with file and metadata
 * @returns {Promise}
 */
export const createDraft = async (formData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_DRAFT, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
    return response.data
}

/**
 * Review content of outgoing document (Manager)
 * @param {string|number} id - Document ID
 * @param {Object} dto - { comment }
 * @returns {Promise}
 */
export const reviewContent = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_REVIEW(id), dto)
    return response.data
}

/**
 * Check format of outgoing document (Clerk)
 * @param {string|number} id - Document ID
 * @param {Object} dto - { comment }
 * @returns {Promise}
 */
export const checkFormat = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_CHECK_FORMAT(id), dto)
    return response.data
}

/**
 * Submit document for signature (Clerk)
 * @param {string|number} id - Document ID
 * @param {Object} dto - { comment }
 * @returns {Promise}
 */
export const submitForSignature = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_SUBMIT(id), dto)
    return response.data
}

/**
 * Sign document (Director)
 * @param {string|number} id - Document ID
 * @param {Object} dto - { comment }
 * @returns {Promise}
 */
export const signDocument = async (id, formData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_SIGN(id), formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
    return response.data
}

/**
 * Issue document number (Clerk)
 * @param {string|number} id - Document ID
 * @param {Object} dto - { comment }
 * @returns {Promise}
 */
export const issueDocument = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_ISSUE(id), dto)
    return response.data
}

/**
 * Publish document (Clerk)
 * @param {string|number} id - Document ID
 * @param {Object} dto - { comment }
 * @returns {Promise}
 */
export const publishDocument = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_PUBLISH(id), dto)
    return response.data
}

/**
 * Archive document (Clerk)
 * @param {string|number} id - Document ID
 * @param {Object} dto - { comment }
 * @returns {Promise}
 */
export const archiveDocument = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_ARCHIVE(id), dto)
    return response.data
}

/**
 * Get workflow history for a document
 * @param {string|number} id - Document ID
 * @returns {Promise}
 */
export const getWorkflowHistory = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKFLOW_HISTORY(id))
    return response.data
}

/**
 * Request department opinions (Manager action: Draft → PendingDepartmentOpinion)
 * @param {string} id - Document ID
 * @param {Object} dto - { departmentIds, deadline, note }
 */
export const requestDepartmentOpinions = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_REQUEST_OPINIONS(id), dto)
    return response.data
}

/**
 * Respond to department opinion request (Department manager: Approve/Reject)
 * @param {string} id - Document ID
 * @param {Object} dto - { isApproved, comment }
 */
export const respondDepartmentOpinion = async (id, dto) => {
    const response = await axiosInstance.post(API_ENDPOINTS.WORKFLOW_RESPOND_OPINION(id), dto)
    return response.data
}

/**
 * Get all department opinions for a document
 * @param {string} id - Document ID
 */
export const getDepartmentOpinions = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.WORKFLOW_GET_OPINIONS(id))
    return response.data
}

export default {
    createDraft,
    reviewContent,
    checkFormat,
    submitForSignature,
    signDocument,
    issueDocument,
    publishDocument,
    archiveDocument,
    getWorkflowHistory,
    requestDepartmentOpinions,
    respondDepartmentOpinion,
    getDepartmentOpinions,
}
