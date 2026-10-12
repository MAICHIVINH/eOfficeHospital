import axios from 'axios'
import { STORAGE_KEYS, TOAST_MESSAGES } from '../utils/constants'
import toast from 'react-hot-toast'
import i18n from '../i18n'

// Create axios instance
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Add anti-caching headers for all requests
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - Handle errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Handle network errors (Backend down or no internet)
        if (!error.response) {
            // Use an ID to prevent multiple toasts of the same error
            toast.error(i18n.t(TOAST_MESSAGES.NETWORK_ERROR), {
                id: 'network-error-toast',
            })
            return Promise.reject(error)
        }

        const { status, data } = error.response

        switch (status) {
            case 400:
                // Bad request - Specific error from backend
                if (data?.errors) {
                    const errorMessages = Object.values(data.errors).flat()
                    errorMessages.forEach((msg) => toast.error(msg))
                } else {
                    toast.error(data?.message || i18n.t('common.messages.error'))
                }
                break;

            case 401:
                // Unauthorized - Token expired or invalid
                localStorage.removeItem(STORAGE_KEYS.TOKEN)
                localStorage.removeItem(STORAGE_KEYS.USER)

                // Chỉ toast "hết phiên" khi đang ở trong app (không phải trang login)
                // Trang login tự xử lý thông báo lỗi đăng nhập sai
                if (window.location.pathname !== '/login') {
                    toast.error(i18n.t(TOAST_MESSAGES.SESSION_EXPIRED), {
                        id: 'auth-error-toast'
                    })
                    window.location.href = '/login'
                }
                break

            case 403:
                // Forbidden - No permission
                toast.error(data?.message || i18n.t(TOAST_MESSAGES.PERMISSION_DENIED))
                break

            case 404:
                // Not found
                toast.error(data?.message || i18n.t('common.messages.loadFailed'))
                break

            case 422:
                // Validation error
                if (data?.errors) {
                    // Handle validation errors
                    const errorMessages = Object.values(data.errors).flat()
                    errorMessages.forEach((msg) => toast.error(msg))
                } else {
                    toast.error(data?.message || i18n.t('common.messages.error'))
                }
                break

            case 500:
                // Server error
                toast.error(data?.message || i18n.t(TOAST_MESSAGES.SERVER_ERROR), {
                    id: 'server-error-toast'
                })
                break

            default:
                toast.error(data?.message || i18n.t('common.messages.error'))
        }

        return Promise.reject(error)
    }
)

export default axiosInstance
