import axiosInstance from './axiosInstance'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Get all departments
 * @param {Object} params - Query parameters
 * @returns {Promise}
 */
export const getDepartments = async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.DEPARTMENTS, { params })
    return response.data
}

/**
 * Get department by ID
 * @param {string|number} id - Department ID
 * @returns {Promise}
 */
export const getDepartmentById = async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.DEPARTMENT_DETAIL(id))
    return response.data
}

/**
 * Create new department
 * @param {Object} departmentData - Department data
 * @returns {Promise}
 */
export const createDepartment = async (departmentData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.DEPARTMENTS, departmentData)
    return response.data
}

/**
 * Update department
 * @param {string|number} id - Department ID
 * @param {Object} departmentData - Department data
 * @returns {Promise}
 */
export const updateDepartment = async (id, departmentData) => {
    const response = await axiosInstance.put(
        API_ENDPOINTS.DEPARTMENT_DETAIL(id),
        departmentData
    )
    return response.data
}

/**
 * Delete department
 * @param {string|number} id - Department ID
 * @returns {Promise}
 */
export const deleteDepartment = async (id) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.DEPARTMENT_DETAIL(id))
    return response.data
}

export default {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
}
