import axiosInstance from './axiosInstance'

const trashApi = {
    getDeletedDocuments: () => axiosInstance.get('/trash/documents'),
    getDeletedUsers: () => axiosInstance.get('/trash/users'),
    getDeletedDepartments: () => axiosInstance.get('/trash/departments'),
    getDeletedAssignments: () => axiosInstance.get('/trash/assignments'),
    getDeletedRoles: () => axiosInstance.get('/trash/roles'),
    getDeletedAuditLogs: () => axiosInstance.get('/trash/auditlogs'),
    restoreItem: (entityType, id) => axiosInstance.post(`/trash/${entityType}/${id}/restore`),
    permanentDelete: (entityType, id) => axiosInstance.delete(`/trash/${entityType}/${id}`),
    bulkPermanentDelete: (entityType, ids) => axiosInstance.post(`/trash/${entityType}/bulk-delete`, { ids }),
}

export default trashApi
