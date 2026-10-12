import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get all documents with filters
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getDocuments = async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENTS, { params })
    // Now backend returns { items: [], totalCount, pageNumber, pageSize, totalPages }
    return response.data
}

/**
 * Get document by ID
 * @param {string|number} id - Document ID
 * @returns {Promise}
 */
export const getDocumentById = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENT_DETAIL(id))
    return response.data
}

/**
 * Create new document (upload)
 * @param {FormData} formData - Form data with file and metadata
 * @returns {Promise}
 */
export const createDocument = async (formData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.DOCUMENTS, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
    return response.data
}

/**
 * Update document
 * @param {string|number} id - Document ID
 * @param {Object} data - Document data
 * @param {File} file - Optional file to upload
 * @returns {Promise}
 */
export const updateDocument = async (id, data, file = null) => {
    // Backend uses [FromForm], so we must always send FormData, not JSON
    const formData = new FormData()
    formData.append('Title', data.title)
    formData.append('Description', data.description || '')
    formData.append('DocumentNumber', data.documentNumber || '')
    formData.append('DocumentType', data.documentType)
    formData.append('SecurityLevel', data.securityLevel)
    if (data.content !== undefined) {
        formData.append('Content', data.content || '')
    }

    if (data.issuingAgencyId) {
        formData.append('IssuingAgencyId', data.issuingAgencyId)
    }


    // Only append file if a new one is provided
    // If no file, backend will keep the existing file
    if (file) {
        formData.append('file', file)
    }

    const response = await axiosInstance.put(API_ENDPOINTS.DOCUMENT_DETAIL(id), formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}

/**
 * Delete document
 * @param {string|number} id - Document ID
 * @returns {Promise}
 */
export const deleteDocument = async (id) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.DOCUMENT_DETAIL(id))
    return response.data
}

/**
 * Get document preview URL
 * @param {string|number} id - Document ID
 * @returns {Promise}
 */
export const getDocumentPreview = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENT_PREVIEW(id))
    return response.data.url
}

/**
 * Download document
 * @param {string|number} id - Document ID
 * @returns {Promise}
 */
export const downloadDocument = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENT_DOWNLOAD(id))
    return response.data
}

/**
 * Assign document to departments
 * @param {string|number} id - Document ID
 * @param {Object} assignmentData - Assignment data
 * @returns {Promise}
 */
export const assignDocument = async (id, assignmentData) => {
    const response = await axiosInstance.post(
        API_ENDPOINTS.DOCUMENT_ASSIGN(id),
        assignmentData
    )
    return response.data
}

/**
 * Assign drafting to a staff (Manager)
 * @param {Object} data - Assignment data (title, assignedToUserId, etc.)
 * @returns {Promise}
 */
export const assignDrafting = async (data) => {
    const response = await axiosInstance.post(
        'document-workflow/assign',
        data
    )
    return response.data
}

/**
 * Reject content review (Manager)
 * @param {string|number} id - Document ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise}
 */
export const rejectContentReview = async (id, rejectionReason) => {
    const response = await axiosInstance.post(
        `document-workflow/${id}/reject-content`,
        { rejectionReason }
    )
    return response.data
}

/**
 * Reject format check (Clerk)
 * @param {string|number} id - Document ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise}
 */
export const rejectFormatCheck = async (id, rejectionReason) => {
    const response = await axiosInstance.post(
        `document-workflow/${id}/reject-format`,
        { rejectionReason }
    )
    return response.data
}

/**
 * Reject submission (Clerk - during FormatChecked stage)
 * @param {string|number} id - Document ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise}
 */
export const rejectSubmission = async (id, rejectionReason) => {
    const response = await axiosInstance.post(
        `document-workflow/${id}/reject-submission`,
        { rejectionReason }
    )
    return response.data
}

/**
 * Reject signature (Admin/Director)
 * @param {string|number} id - Document ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise}
 */
export const rejectSignature = async (id, rejectionReason) => {
    const response = await axiosInstance.post(
        `document-workflow/${id}/reject-signature`,
        { rejectionReason }
    )
    return response.data
}

/**
 * Get system document statistics
 * @returns {Promise}
 */
export const getStatistics = async () => {
    const response = await axiosInstance.get('/documents/statistics')
    return response.data
}

/**
 * Export incoming documents to Excel (Professional styled backend export)
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise}
 */
export const exportIncomingToExcel = async (params = {}) => {
    const response = await axiosInstance.get('/documents/export/incoming', {
        params,
        responseType: 'blob'
    })
    return response.data
}

/**
 * Export outgoing documents to Excel (Professional styled backend export)
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise}
 */
export const exportOutgoingToExcel = async (params = {}) => {
    const response = await axiosInstance.get('/documents/export/outgoing', {
        params,
        responseType: 'blob'
    })
    return response.data
}

/**
 * Get archive statistics (Monthly counts)
 * @param {number} year - Year to get stats for
 * @returns {Promise}
 */
export const getArchiveStatistics = async (year, category) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ARCHIVE_STATISTICS, { params: { year, category } })
    return response.data
}

/**
 * Export annual archive to Excel (12 sheets)
 * @param {number} year - Year to export
 * @returns {Promise}
 */
export const exportArchiveToExcel = async (year) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ARCHIVE_EXPORT, {
        params: { year },
        responseType: 'blob'
    })
    return response.data
}

/**
 * Export annual outgoing archive to Excel (grouped by month)
 * @param {number} year - Year to export
 * @returns {Promise}
 */
export const exportArchiveOutgoingToExcel = async (year) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ARCHIVE_OUTGOING_EXPORT, {
        params: { year },
        responseType: 'blob'
    })
    return response.data
}

export default {
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentPreview,
    downloadDocument,
    assignDocument,
    rejectContentReview,
    rejectFormatCheck,
    rejectSubmission,
    rejectSignature,
    getStatistics,
    exportIncomingToExcel,
    exportOutgoingToExcel,
    getArchiveStatistics,
    exportArchiveToExcel,
    exportArchiveOutgoingToExcel,
}
