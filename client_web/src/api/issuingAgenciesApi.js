import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get all issuing agencies
 * @param {Object} params - Query parameters (e.g., activeOnly)
 * @returns {Promise}
 */
export const getIssuingAgencies = async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ISSUING_AGENCIES, { params })
    return response.data
}

/**
 * Get issuing agency by ID
 * @param {string} id - Agency ID
 * @returns {Promise}
 */
export const getIssuingAgencyById = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ISSUING_AGENCY_DETAIL(id))
    return response.data
}

/**
 * Create new issuing agency
 * @param {Object} data - Agency data
 * @returns {Promise}
 */
export const createIssuingAgency = async (data) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ISSUING_AGENCIES, data)
    return response.data
}

/**
 * Update issuing agency
 * @param {string} id - Agency ID
 * @param {Object} data - Agency data
 * @returns {Promise}
 */
export const updateIssuingAgency = async (id, data) => {
    const response = await axiosInstance.put(API_ENDPOINTS.ISSUING_AGENCY_DETAIL(id), data)
    return response.data
}

/**
 * Delete issuing agency
 * @param {string} id - Agency ID
 * @returns {Promise}
 */
export const deleteIssuingAgency = async (id) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.ISSUING_AGENCY_DETAIL(id))
    return response.data
}

export default {
    getIssuingAgencies,
    getIssuingAgencyById,
    createIssuingAgency,
    updateIssuingAgency,
    deleteIssuingAgency,
}
