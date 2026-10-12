import { format, parseISO, isValid } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { DATE_FORMATS } from './constants'
import i18n from '../i18n'

/**
 * Internal helper to safely parse dates and handle missing UTC indicators
 * @param {string|Date} date 
 * @returns {Date|null}
 */
const parseSafe = (date) => {
    if (!date) return null
    if (date instanceof Date) return date

    if (typeof date === 'string') {
        // If it's an ISO string without timezone indicator, append 'Z' (UTC)
        // This handles .NET's Unspecified kind serialized without 'Z'
        const isoStr = (date.includes('T') && !date.endsWith('Z') && !date.includes('+'))
            ? `${date}Z`
            : date
        return parseISO(isoStr)
    }
    return null
}

/**
 * Format date to display format
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (optional)
 * @returns {string} Formatted date
 */
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY) => {
    const dateObj = parseSafe(date)
    if (!dateObj || !isValid(dateObj)) return '-'

    try {
        const currentLocale = i18n.language === 'en' ? enUS : vi
        return format(dateObj, formatStr, { locale: currentLocale })
    } catch (error) {
        console.error('Error formatting date:', error)
        return '-'
    }
}

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (date) => {
    return formatDate(date, DATE_FORMATS.DISPLAY_TIME)
}

/**
 * Format only time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time (HH:mm)
 */
export const formatTime = (date) => {
    const dateObj = parseSafe(date)
    if (!dateObj || !isValid(dateObj)) return '-'
    return dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Normalize enum string from backend (PascalCase/UPPERCASE) to SNAKE_CASE
 * @param {string} str - Input string
 * @returns {string} SNAKE_CASE string
 */
const normalizeEnum = (str) => {
    if (!str) return ''

    // If it's already all uppercase with underscores, return as is
    if (/^[A-Z0-9_]+$/.test(str)) return str

    return str
        .replace(/([A-Z])/g, '_$1') // Add underscore before capitals
        .toUpperCase() // Convert to uppercase
        .replace(/^_/, '') // Remove leading underscore
        .replace(/_+/g, '_') // Replace multiple underscores with one
}

/**
 * Format status to display text
 * @param {string} status - Status code (PascalCase or UPPERCASE)
 * @returns {string} Display text
 */
export const formatStatus = (status) => {
    if (!status) return '-'
    const normalizedStatus = normalizeEnum(status)
    return i18n.t(`formatters.status.${normalizedStatus}`) || status
}

/**
 * Format role to display text
 * @param {string} role - Role code or Vietnamese name
 * @returns {string} Display text
 */
export const formatRole = (role) => {
    if (!role) return '-'

    // Map common role names (English and Vietnamese) to standard keys
    const roleMapping = {
        'admin': 'ADMIN',
        'quản trị viên': 'ADMIN',
        'director': 'DIRECTOR',
        'ban giám đốc': 'DIRECTOR',
        'clerk': 'CLERK',
        'văn thư': 'CLERK',
        'manager': 'MANAGER',
        'quản lý': 'MANAGER',
        'staff': 'STAFF',
        'nhân viên': 'STAFF',
        'main': 'MAIN',
        'xử lý chính': 'MAIN',
        'support': 'SUPPORT',
        'phối hợp': 'SUPPORT'
    }

    // Normalize input for lookup
    const roleKey = role.toLowerCase().trim()
    const normalizedRole = roleMapping[roleKey] || normalizeEnum(role)

    return i18n.t(`formatters.role.${normalizedRole}`) || role
}

/**
 * Format document type to display text
 * @param {string} type - Document type (enum string from backend)
 * @returns {string} Display text
 */
export const formatDocumentType = (type) => {
    if (!type) return '-'

    // Handle integer strings from backend
    const legacyMap = {
        '1': 'DIRECTIVE',
        '2': 'REPORT',
        '3': 'DECISION',
        '4': 'NOTIFICATION',
        '5': 'PROCEDURE',
        '6': 'MINUTES',
        '7': 'PLAN',
        '8': 'PROPOSAL',
        '9': 'AUTHORIZATION',
        '10': 'INTRODUCTION_LETTER',
        '11': 'CONTRACT',
        '12': 'WORK_CERTIFICATE',
        '13': 'ADMIN_RECORD',
        '99': 'OTHER'
    }

    // Normalize to SNAKE_CASE
    const normalizedType = legacyMap[type] || normalizeEnum(type)
    return i18n.t(`formatters.documentType.${normalizedType}`) || normalizedType
}

/**
 * Format security level to display text
 * @param {string} level - Security level (enum string from backend)
 * @returns {string} Display text
 */
export const formatSecurityLevel = (level) => {
    if (!level) return '-'

    // Handle integer strings
    const legacyMap = {
        '1': 'PUBLIC',
        '2': 'INTERNAL',
        '3': 'CONFIDENTIAL'
    }

    // Normalize to SNAKE_CASE
    const normalizedLevel = legacyMap[level] || normalizeEnum(level)
    return i18n.t(`formatters.securityLevel.${normalizedLevel}`) || normalizedLevel
}


/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return ''
    if (text.length <= maxLength) return text

    return text.substring(0, maxLength) + '...'
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
    if (!name) return ''

    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return ''

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')

    // Format as: 0123 456 789
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
    }

    return phone
}

/**
 * Capitalize first letter
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeFirst = (text) => {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Format currency (VND)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-'

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

/**
 * Get relative time (e.g., "2 giờ trước")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time
 */
export const getRelativeTime = (date) => {
    const dateObj = parseSafe(date)
    if (!dateObj || !isValid(dateObj)) return ''

    try {
        const now = new Date()
        const diffInSeconds = Math.floor((now - dateObj) / 1000)

        if (diffInSeconds < 60) return i18n.t('formatters.relativeTime.justNow')
        if (diffInSeconds < 3600) return i18n.t('formatters.relativeTime.minutesAgo', { count: Math.floor(diffInSeconds / 60) })
        if (diffInSeconds < 86400) return i18n.t('formatters.relativeTime.hoursAgo', { count: Math.floor(diffInSeconds / 3600) })
        if (diffInSeconds < 604800) return i18n.t('formatters.relativeTime.daysAgo', { count: Math.floor(diffInSeconds / 86400) })

        return formatDate(dateObj)
    } catch (error) {
        console.error('Error getting relative time:', error)
        return ''
    }
}

/**
 * Check if a date is overdue (strictly before today)
 * @param {string|Date} deadline - Deadline date
 * @returns {boolean} True if overdue
 */
export const isOverdue = (deadline) => {
    const deadlineDate = parseSafe(deadline)
    if (!deadlineDate || !isValid(deadlineDate)) return false

    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const deadlineDay = new Date(deadlineDate)
        deadlineDay.setHours(0, 0, 0, 0)

        return deadlineDay < today
    } catch (error) {
        console.error('Error checking overdue status:', error)
        return false
    }
}
