import { FILE_UPLOAD } from './constants'

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate phone number (Vietnamese format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
    const phoneRegex = /^(0|\+84)[0-9]{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'Mật khẩu không được để trống' }
    }

    if (password.length < 6) {
        return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
    }

    if (password.length > 50) {
        return { isValid: false, message: 'Mật khẩu không được quá 50 ký tự' }
    }

    // Optional: Check for complexity
    // const hasUpperCase = /[A-Z]/.test(password)
    // const hasLowerCase = /[a-z]/.test(password)
    // const hasNumber = /[0-9]/.test(password)
    // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    // if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    //   return { isValid: false, message: 'Mật khẩu phải chứa chữ hoa, chữ thường và số' }
    // }

    return { isValid: true, message: '' }
}

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateFile = (file) => {
    if (!file) {
        return { isValid: false, message: 'Vui lòng chọn file' }
    }

    // Check file size
    if (file.size > FILE_UPLOAD.MAX_SIZE) {
        return {
            isValid: false,
            message: `Kích thước file không được vượt quá ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`,
        }
    }

    // Check file type
    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
        return {
            isValid: false,
            message: 'Định dạng file không được hỗ trợ',
        }
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase()
    if (!FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(extension)) {
        return {
            isValid: false,
            message: `Chỉ chấp nhận các định dạng: ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`,
        }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateRequired = (value, fieldName = 'Trường này') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { isValid: false, message: `${fieldName} không được để trống` }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate string length
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateLength = (value, min, max, fieldName = 'Trường này') => {
    if (!value) {
        return { isValid: true, message: '' }
    }

    if (value.length < min) {
        return { isValid: false, message: `${fieldName} phải có ít nhất ${min} ký tự` }
    }

    if (value.length > max) {
        return { isValid: false, message: `${fieldName} không được quá ${max} ký tự` }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return { isValid: true, message: '' }
    }

    if (new Date(startDate) > new Date(endDate)) {
        return { isValid: false, message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateForm = (data, rules) => {
    const errors = {}
    let isValid = true

    Object.keys(rules).forEach((field) => {
        const rule = rules[field]
        const value = data[field]

        // Required validation
        if (rule.required) {
            const result = validateRequired(value, rule.label || field)
            if (!result.isValid) {
                errors[field] = result.message
                isValid = false
                return
            }
        }

        // Skip other validations if value is empty and not required
        if (!value) return

        // Email validation
        if (rule.email && !isValidEmail(value)) {
            errors[field] = 'Email không hợp lệ'
            isValid = false
            return
        }

        // Phone validation
        if (rule.phone && !isValidPhone(value)) {
            errors[field] = 'Số điện thoại không hợp lệ'
            isValid = false
            return
        }

        // Length validation
        if (rule.minLength || rule.maxLength) {
            const result = validateLength(
                value,
                rule.minLength || 0,
                rule.maxLength || Infinity,
                rule.label || field
            )
            if (!result.isValid) {
                errors[field] = result.message
                isValid = false
                return
            }
        }

        // Custom validation
        if (rule.custom) {
            const result = rule.custom(value, data)
            if (!result.isValid) {
                errors[field] = result.message
                isValid = false
                return
            }
        }
    })

    return { isValid, errors }
}
