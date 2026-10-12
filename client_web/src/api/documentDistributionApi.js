import axiosInstance from './axiosInstance'

/**
 * Phát hành văn bản đi (nội bộ hoặc ra ngoài)
 * @param {string} documentId
 * @param {object} dto - { distributionType, departmentIds?, externalRecipientName?, sentAt?, notes? }
 */
export const publishDocument = (documentId, dto) =>
    axiosInstance.post(`/document-distribution/${documentId}/publish`, dto).then(r => r.data)

/**
 * Lấy danh sách bản ghi phát hành của một văn bản
 */
export const getDistributions = (documentId) =>
    axiosInstance.get(`/document-distribution/${documentId}/list`).then(r => r.data)

/**
 * Văn thư xác nhận đối tác bên ngoài đã nhận
 */
export const confirmExternalReceipt = (distributionId, dto) =>
    axiosInstance.put(`/document-distribution/${distributionId}/confirm-external`, dto).then(r => r.data)

/**
 * Trưởng khoa/nhân viên cập nhật trạng thái xử lý nội bộ
 */
export const updateDistributionStatus = (distributionId, dto) =>
    axiosInstance.put(`/document-distribution/${distributionId}/status`, dto).then(r => r.data)

/**
 * Nộp file báo cáo kết quả
 */
export const uploadDistributionReport = (distributionId, reportFile, notes) => {
    const formData = new FormData()
    formData.append('reportFile', reportFile)
    if (notes) formData.append('notes', notes)
    return axiosInstance.post(
        `/document-distribution/${distributionId}/report`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data)
}

/**
 * Tải xuống file báo cáo
 */
export const downloadDistributionReport = (distributionId) =>
    axiosInstance.get(`/document-distribution/${distributionId}/report/download`, {
        responseType: 'blob'
    }).then(r => r.data)
