import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import auditLogsApi from '../api/auditLogsApi'

// Initial state
const initialState = {
    logs: [],
    pagination: {
        totalCount: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
    },
    currentLog: null,
    statistics: null,
    loading: false,
    error: null,
    filters: {
        userId: '',
        action: '',
        fromDate: '',
        toDate: '',
    },
}

// Async thunks
export const fetchAuditLogs = createAsyncThunk(
    'auditLogs/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            const data = await auditLogsApi.getAuditLogs(params)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lấy nhật ký hệ thống thất bại')
        }
    }
)

export const fetchAuditLogById = createAsyncThunk(
    'auditLogs/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const data = await auditLogsApi.getAuditLogById(id)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lấy chi tiết nhật ký thất bại')
        }
    }
)

export const fetchAuditStatistics = createAsyncThunk(
    'auditLogs/fetchStatistics',
    async (params, { rejectWithValue }) => {
        try {
            const data = await auditLogsApi.getAuditStatistics(params)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lấy thống kê nhật ký thất bại')
        }
    }
)

export const deleteAuditLog = createAsyncThunk(
    'auditLogs/delete',
    async (id, { rejectWithValue }) => {
        try {
            await auditLogsApi.deleteAuditLog(id)
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Xóa nhật ký thất bại')
        }
    }
)

// Slice
const auditLogsSlice = createSlice({
    name: 'auditLogs',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
            state.pagination.page = 1 // Reset to first page when filters change
        },
        setPage: (state, action) => {
            state.pagination.page = action.payload
        },
        setPageSize: (state, action) => {
            state.pagination.pageSize = action.payload
            state.pagination.page = 1 // Reset to first page when page size changes
        },
        clearFilters: (state) => {
            state.filters = initialState.filters
            state.pagination.page = 1
        },
        clearCurrentLog: (state) => {
            state.currentLog = null
        },
    },
    extraReducers: (builder) => {
        // Fetch Audit Logs
        builder
            .addCase(fetchAuditLogs.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchAuditLogs.fulfilled, (state, action) => {
                state.loading = false
                state.logs = action.payload.data
                state.pagination = {
                    totalCount: action.payload.totalCount,
                    page: action.payload.page,
                    pageSize: action.payload.pageSize,
                    totalPages: action.payload.totalPages,
                }
            })
            .addCase(fetchAuditLogs.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch Audit Log By ID
        builder
            .addCase(fetchAuditLogById.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchAuditLogById.fulfilled, (state, action) => {
                state.loading = false
                state.currentLog = action.payload
            })
            .addCase(fetchAuditLogById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch Statistics
        builder
            .addCase(fetchAuditStatistics.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchAuditStatistics.fulfilled, (state, action) => {
                state.loading = false
                state.statistics = action.payload
            })
            .addCase(fetchAuditStatistics.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Delete Audit Log (Soft delete)
        builder
            .addCase(deleteAuditLog.fulfilled, (state, action) => {
                state.logs = state.logs.filter(log => log.id !== action.payload)
                state.pagination.totalCount -= 1
            })
    },
})

export const { setFilters, setPage, setPageSize, clearFilters, clearCurrentLog } = auditLogsSlice.actions

// Selectors
export const selectAuditLogs = (state) => state.auditLogs.logs
export const selectAuditPagination = (state) => state.auditLogs.pagination
export const selectAuditFilters = (state) => state.auditLogs.filters
export const selectAuditLoading = (state) => state.auditLogs.loading
export const selectAuditError = (state) => state.auditLogs.error
export const selectAuditStatistics = (state) => state.auditLogs.statistics
export const selectCurrentAuditLog = (state) => state.auditLogs.currentLog

export default auditLogsSlice.reducer
