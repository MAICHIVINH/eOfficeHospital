import axiosInstance from './axiosInstance';

const API_BASE = '/notifications';

export const notificationApi = {
    // Lấy tóm tắt thông báo (số chưa đọc + danh sách gần nhất)
    getSummary: async () => {
        const response = await axiosInstance.get(`${API_BASE}/summary`);
        return response.data;
    },

    // Lấy danh sách thông báo
    getNotifications: async (limit = 20) => {
        const response = await axiosInstance.get(`${API_BASE}?limit=${limit}`);
        return response.data;
    },

    // Đánh dấu đã đọc
    markAsRead: async (notificationId) => {
        const response = await axiosInstance.put(`${API_BASE}/${notificationId}/read`);
        return response.data;
    },

    // Đánh dấu tất cả đã đọc
    markAllAsRead: async () => {
        const response = await axiosInstance.put(`${API_BASE}/read-all`);
        return response.data;
    },

    // Xóa thông báo
    deleteNotification: async (notificationId) => {
        const response = await axiosInstance.delete(`${API_BASE}/${notificationId}`);
        return response.data;
    },

    // Lấy toàn bộ thông báo hệ thống (Admin)
    getAdminNotifications: async (limit = 100) => {
        const response = await axiosInstance.get(`${API_BASE}/admin?limit=${limit}`);
        return response.data;
    },

    // Xóa bất kỳ thông báo nào (Admin)
    adminDeleteNotification: async (notificationId) => {
        const response = await axiosInstance.delete(`${API_BASE}/admin/${notificationId}`);
        return response.data;
    }
};
