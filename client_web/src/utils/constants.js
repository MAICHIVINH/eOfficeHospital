// Role constants
export const ROLES = {
    ADMIN: 'ADMIN',
    DIRECTOR: 'DIRECTOR',
    CLERK: 'CLERK',
    MANAGER: 'MANAGER',
    STAFF: 'STAFF',
}

// Permission constants (must match backend exactly)
export const PERMISSIONS = {
    // Document permissions
    DOCUMENTS_VIEW: 'Permissions.Documents.View',
    DOCUMENTS_CREATE: 'Permissions.Documents.Create',
    DOCUMENTS_EDIT: 'Permissions.Documents.Edit',
    DOCUMENTS_DELETE: 'Permissions.Documents.Delete',
    DOCUMENTS_ASSIGN: 'Permissions.Documents.Assign',
    DOCUMENTS_UPLOAD: 'Permissions.Documents.Upload',
    DOCUMENTS_ARCHIVE: 'Permissions.Documents.Archive',

    // User permissions
    USERS_VIEW: 'Permissions.Users.View',
    USERS_CREATE: 'Permissions.Users.Create',
    USERS_EDIT: 'Permissions.Users.Edit',
    USERS_DELETE: 'Permissions.Users.Delete',

    // Department permissions
    DEPARTMENTS_VIEW: 'Permissions.Departments.View',
    DEPARTMENTS_CREATE: 'Permissions.Departments.Create',
    DEPARTMENTS_EDIT: 'Permissions.Departments.Edit',
    DEPARTMENTS_DELETE: 'Permissions.Departments.Delete',

    // Role permissions
    ROLES_VIEW: 'Permissions.Roles.View',
    ROLES_CREATE: 'Permissions.Roles.Create',
    ROLES_EDIT: 'Permissions.Roles.Edit',
    ROLES_DELETE: 'Permissions.Roles.Delete',
    ROLES_ASSIGN_PERMISSIONS: 'Permissions.Roles.AssignPermissions',

    // Permission permissions
    PERMISSIONS_VIEW: 'Permissions.Permissions.View',
    PERMISSIONS_CREATE: 'Permissions.Permissions.Create',
    PERMISSIONS_EDIT: 'Permissions.Permissions.Edit',
    PERMISSIONS_DELETE: 'Permissions.Permissions.Delete',

    // Audit log permissions
    AUDIT_LOGS_VIEW: 'Permissions.AuditLogs.View',

    // Outgoing workflow permissions
    OUTGOING_ASSIGN: 'Permissions.Outgoing.Assign',
    OUTGOING_DRAFT: 'Permissions.Outgoing.Draft',
    OUTGOING_REVIEW: 'Permissions.Outgoing.Review',
    OUTGOING_CHECK_FORMAT: 'Permissions.Outgoing.CheckFormat',
    OUTGOING_SUBMIT: 'Permissions.Outgoing.Submit',
    OUTGOING_SIGN: 'Permissions.Outgoing.Sign',
    OUTGOING_ISSUE: 'Permissions.Outgoing.Issue',
    OUTGOING_PUBLISH: 'Permissions.Outgoing.Publish',
    OUTGOING_ARCHIVE: 'Permissions.Outgoing.Archive',

    // Incoming workflow permissions
    INCOMING_APPROVE: 'Permissions.Documents.Approve',
    INCOMING_REJECT: 'Permissions.Documents.Reject',

    // Notification permissions
    NOTIFICATIONS_VIEW: 'Permissions.Notifications.View',
    NOTIFICATIONS_DELETE: 'Permissions.Notifications.Delete',

    // Issuing Agency permissions
    ISSUING_AGENCIES_VIEW: 'Permissions.IssuingAgencies.View',
    ISSUING_AGENCIES_CREATE: 'Permissions.IssuingAgencies.Create',
    ISSUING_AGENCIES_EDIT: 'Permissions.IssuingAgencies.Edit',
    ISSUING_AGENCIES_DELETE: 'Permissions.IssuingAgencies.Delete',
}

// Document categories
export const DOCUMENT_CATEGORY = {
    INCOMING: 'Incoming',
    OUTGOING: 'Outgoing',
}

// Document category display names
export const DOCUMENT_CATEGORY_LABELS = {
    Incoming: 'Văn bản đến',
    Outgoing: 'Văn bản đi',
}

// Workflow status enum (matches backend)
export const WORKFLOW_STATUS = {
    PENDING_DRAFT: 'PendingDraft',
    DRAFT: 'Draft',
    PENDING_DEPARTMENT_OPINION: 'PendingDepartmentOpinion',
    UNIT_REVIEWED: 'UnitReviewed',
    FORMAT_CHECKED: 'FormatChecked',
    WAITING_FOR_SIGN: 'WaitingForSign',
    SIGNED: 'Signed',
    ISSUED: 'Issued',
    SENT: 'Sent',
    ARCHIVED: 'Archived',
    INCOMING_PENDING: 'IncomingPending',
    INCOMING_APPROVED: 'IncomingApproved',
    INCOMING_REJECTED: 'IncomingRejected',
}

// Workflow status display names
export const WORKFLOW_STATUS_LABELS = {
    PendingDraft: 'Chờ phân công',
    Draft: 'Bản thảo',
    PendingDepartmentOpinion: 'Chờ ý kiến phòng ban',
    UnitReviewed: 'Đã duyệt nội dung',
    FormatChecked: 'Đã kiểm tra thể thức',
    WaitingForSign: 'Chờ ký',
    Signed: 'Đã ký',
    Issued: 'Đã cấp số',
    Sent: 'Đã phát hành',
    Archived: 'Đã lưu trữ',
    IncomingPending: 'Chờ duyệt',
    IncomingApproved: 'Đã duyệt',
    IncomingRejected: 'Từ chối',
}

// Workflow status colors
export const WORKFLOW_STATUS_COLORS = {
    PendingDraft: 'amber',
    Draft: 'gray',
    PendingDepartmentOpinion: 'orange',
    UnitReviewed: 'blue',
    FormatChecked: 'cyan',
    WaitingForSign: 'yellow',
    Signed: 'purple',
    Issued: 'indigo',
    Sent: 'green',
    Archived: 'dark',
    IncomingPending: 'yellow',
    IncomingApproved: 'green',
    IncomingRejected: 'red',
}

// Document types (Display names)
export const DOCUMENT_TYPES = {
    DIRECTIVE: 'Công văn chỉ đạo',
    REPORT: 'Báo cáo',
    DECISION: 'Quyết định',
    NOTIFICATION: 'Thông báo',
    PROCEDURE: 'Quy trình',
    MINUTES: 'Biên bản',
    PLAN: 'Kế hoạch',
    PROPOSAL: 'Tờ trình',
    AUTHORIZATION: 'Giấy ủy quyền',
    INTRODUCTION_LETTER: 'Giấy giới thiệu',
    CONTRACT: 'Hợp đồng',
    WORK_CERTIFICATE: 'GXN công tác',
    ADMIN_RECORD: 'Hồ sơ HCNS',
    OTHER: 'Khác',
}

// Document type enum values (for API)
export const DOCUMENT_TYPE_ENUM = {
    DIRECTIVE: 1,
    REPORT: 2,
    DECISION: 3,
    NOTIFICATION: 4,
    PROCEDURE: 5,
    MINUTES: 6,
    PLAN: 7,
    PROPOSAL: 8,
    AUTHORIZATION: 9,
    INTRODUCTION_LETTER: 10,
    CONTRACT: 11,
    WORK_CERTIFICATE: 12,
    ADMIN_RECORD: 13,
    OTHER: 99,
}

// Security levels (Display names)
export const SECURITY_LEVELS = {
    PUBLIC: 'Công khai',
    INTERNAL: 'Nội bộ',
    CONFIDENTIAL: 'Mật',
}

// Security level enum values (for API)
export const SECURITY_LEVEL_ENUM = {
    PUBLIC: 1,
    INTERNAL: 2,
    CONFIDENTIAL: 3,
}

// Document status
export const DOCUMENT_STATUS = {
    PENDING: 'Chờ xử lý',
    IN_PROGRESS: 'Đang xử lý',
    COMPLETED: 'Hoàn thành',
    OVERDUE: 'Quá hạn',
    CANCELLED: 'Đã hủy',
}

// Assignment roles (Display names)
export const ASSIGNMENT_ROLES = {
    MAIN: 'Xử lý chính',
    SUPPORT: 'Phối hợp',
}

// Assignment role enum values (for API)
export const ASSIGNMENT_ROLE_ENUM = {
    MAIN: 1,
    SUPPORT: 2,
}

// Assignment status
export const ASSIGNMENT_STATUS = {
    PENDING: 'Chờ xử lý',
    IN_PROGRESS: 'Đang xử lý',
    COMPLETED: 'Hoàn thành',
    REJECTED: 'Từ chối',
}

// Status colors for badges
export const STATUS_COLORS = {
    PENDING: 'warning',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    OVERDUE: 'danger',
    CANCELLED: 'gray',
    REJECTED: 'danger',
    // Assignment API values
    Pending: 'warning',
    InProgress: 'info',
    Completed: 'success',
    Rejected: 'danger',
}

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
}

// API endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_CODE: '/auth/verify-reset-code',
    RESET_PASSWORD: '/auth/reset-password',

    // Documents
    DOCUMENTS: '/documents',
    DOCUMENT_DETAIL: (id) => `/documents/${id}`,
    DOCUMENT_PREVIEW: (id) => `/documents/${id}/preview`,
    DOCUMENT_DOWNLOAD: (id) => `/documents/${id}/download`,
    DOCUMENT_ASSIGN: (id) => `/documents/${id}/assign`,

    // Outgoing Workflow
    WORKFLOW_DRAFT: '/document-workflow/draft',
    WORKFLOW_REVIEW: (id) => `/document-workflow/${id}/review-content`,
    WORKFLOW_CHECK_FORMAT: (id) => `/document-workflow/${id}/check-format`,
    WORKFLOW_SUBMIT: (id) => `/document-workflow/${id}/submit-for-signature`,
    WORKFLOW_SIGN: (id) => `/document-workflow/${id}/sign`,
    WORKFLOW_ISSUE: (id) => `/document-workflow/${id}/issue`,
    WORKFLOW_PUBLISH: (id) => `/document-workflow/${id}/publish`,
    WORKFLOW_ARCHIVE: (id) => `/document-workflow/${id}/archive`,
    WORKFLOW_HISTORY: (id) => `/document-workflow/${id}/history`,
    WORKFLOW_REQUEST_OPINIONS: (id) => `/document-workflow/${id}/request-opinions`,
    WORKFLOW_RESPOND_OPINION: (id) => `/document-workflow/${id}/respond-opinion`,
    WORKFLOW_GET_OPINIONS: (id) => `/document-workflow/${id}/opinions`,

    // Incoming Workflow
    INCOMING_APPROVE: (id) => `/incoming-workflow/${id}/approve`,
    INCOMING_REJECT: (id) => `/incoming-workflow/${id}/reject`,
    INCOMING_ARCHIVE: (id) => `/incoming-workflow/${id}/archive`,

    // Users
    USERS: '/users',
    USER_DETAIL: (id) => `/users/${id}`,
    USER_CHANGE_PASSWORD: (id) => `/users/${id}/change-password`,
    MY_CHANGE_PASSWORD: '/users/me/change-password',
    MY_PROFILE_UPDATE: '/users/me',

    // Departments
    DEPARTMENTS: '/departments',
    DEPARTMENT_DETAIL: (id) => `/departments/${id}`,

    // Roles
    ROLES: '/roles',
    ROLE_DETAIL: (id) => `/roles/${id}`,

    // Permissions
    PERMISSIONS: '/permissions',

    // Audit logs
    AUDIT_LOGS: '/auditlogs',

    // Archive
    ARCHIVE_STATISTICS: '/documents/archive/statistics',
    ARCHIVE_EXPORT: '/documents/archive/export',
    ARCHIVE_OUTGOING_EXPORT: '/documents/archive/outgoing/export',

    // Issuing Agencies
    ISSUING_AGENCIES: '/issuingagencies',
    ISSUING_AGENCY_DETAIL: (id) => `/issuingagencies/${id}`,
}

// Local storage keys
export const STORAGE_KEYS = {
    TOKEN: 'hospital_doc_token',
    USER: 'hospital_doc_user',
    REFRESH_TOKEN: 'hospital_doc_refresh_token',
}

// Date formats
export const DATE_FORMATS = {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_TIME: 'dd/MM/yyyy HH:mm',
    API: 'yyyy-MM-dd',
    API_TIME: "yyyy-MM-dd'T'HH:mm:ss",
}

// File upload
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg'
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg'],
}

// Toast messages
export const TOAST_MESSAGES = {
    LOGIN_SUCCESS: 'auth.loginSuccess',
    LOGIN_ERROR: 'auth.loginFailed',
    LOGOUT_SUCCESS: 'auth.logoutSuccess',

    CREATE_SUCCESS: 'common.messages.createSuccess',
    CREATE_ERROR: 'common.messages.createFailed',

    UPDATE_SUCCESS: 'common.messages.updateSuccess',
    UPDATE_ERROR: 'common.messages.updateFailed',

    DELETE_SUCCESS: 'common.messages.deleteSuccess',
    DELETE_ERROR: 'common.messages.deleteFailed',

    UPLOAD_SUCCESS: 'documents.uploadSuccess',
    UPLOAD_ERROR: 'documents.uploadFailed',

    ASSIGN_SUCCESS: 'assignments.assignSuccess',
    ASSIGN_ERROR: 'assignments.assignFailed',

    PERMISSION_DENIED: 'common.messages.noPermission',
    SESSION_EXPIRED: 'auth.sessionExpired',

    NETWORK_ERROR: 'common.messages.networkError',
    SERVER_ERROR: 'common.messages.serverError',
}
