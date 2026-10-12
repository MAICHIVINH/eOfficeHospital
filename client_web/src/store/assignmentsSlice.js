import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import assignmentsApi from '../api/assignmentsApi'
import i18n from '../i18n'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
    assignments: [],
    allAssignments: [],
    myDepartmentAssignments: [],
    adminDashboardStats: [],
    statistics: null,
    loading: false,
    error: null,
    filters: {
        status: '',
        departmentId: '',
        searchTerm: '',
    },
}

// Async thunks
export const fetchAllAssignments = createAsyncThunk(
    'assignments/fetchAllAssignments',
    async (_, { rejectWithValue }) => {
        try {
            const data = await assignmentsApi.getAllAssignments()
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const fetchDocumentAssignments = createAsyncThunk(
    'assignments/fetchDocumentAssignments',
    async (documentId, { rejectWithValue }) => {
        try {
            const data = await assignmentsApi.getDocumentAssignments(documentId)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const fetchMyDepartmentAssignments = createAsyncThunk(
    'assignments/fetchMyDepartmentAssignments',
    async (_, { rejectWithValue }) => {
        try {
            const data = await assignmentsApi.getMyDepartmentAssignments()
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const updateAssignmentStatus = createAsyncThunk(
    'assignments/updateStatus',
    async ({ id, formData, status }, { rejectWithValue }) => {
        try {
            // If formData is provided, use it directly (for file uploads)
            if (formData) {
                const data = await assignmentsApi.updateAssignmentStatus(id, formData)
                return { id, status: null, data }
            }

            // Otherwise, use the old method (for backward compatibility)
            const statusMap = {
                'Pending': 1,
                'InProgress': 2,
                'Completed': 3,
                'Rejected': 4
            }

            const statusValue = statusMap[status] || status
            const data = await assignmentsApi.updateAssignmentStatus(id, { status: statusValue })
            return { id, status, data }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('assignments.updateFailed'))
        }
    }
)

export const removeAssignment = createAsyncThunk(
    'assignments/removeAssignment',
    async (id, { rejectWithValue }) => {
        try {
            await assignmentsApi.deleteAssignment(id)
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.deleteFailed'))
        }
    }
)

export const fetchDepartmentStatistics = createAsyncThunk(
    'assignments/fetchStatistics',
    async (departmentId, { rejectWithValue }) => {
        try {
            const data = await assignmentsApi.getDepartmentStatistics(departmentId)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const fetchAdminDashboardStats = createAsyncThunk(
    'assignments/fetchAdminDashboardStats',
    async (_, { rejectWithValue }) => {
        try {
            const data = await assignmentsApi.getAdminDashboardStats()
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

// Slice
const assignmentsSlice = createSlice({
    name: 'assignments',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
        },
        clearFilters: (state) => {
            state.filters = initialState.filters
        },
    },
    extraReducers: (builder) => {
        // Fetch all assignments
        builder
            .addCase(fetchAllAssignments.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchAllAssignments.fulfilled, (state, action) => {
                state.loading = false
                state.allAssignments = action.payload
            })
            .addCase(fetchAllAssignments.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch document assignments
        builder
            .addCase(fetchDocumentAssignments.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDocumentAssignments.fulfilled, (state, action) => {
                state.loading = false
                state.assignments = action.payload
            })
            .addCase(fetchDocumentAssignments.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch my department assignments
        builder
            .addCase(fetchMyDepartmentAssignments.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchMyDepartmentAssignments.fulfilled, (state, action) => {
                state.loading = false
                state.myDepartmentAssignments = action.payload
            })
            .addCase(fetchMyDepartmentAssignments.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Update assignment status
        builder
            .addCase(updateAssignmentStatus.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateAssignmentStatus.fulfilled, (state, action) => {
                state.loading = false
                const { id, status } = action.payload

                const updateStatus = (arr) => {
                    const index = arr.findIndex(a => a.id === id)
                    if (index !== -1) {
                        if (status) arr[index].status = status
                        if (action.payload.data) {
                            arr[index].reportFileName = action.payload.data.reportFileName
                            arr[index].reportFilePath = action.payload.data.reportFilePath
                            if (action.payload.data.completedAt) arr[index].status = 'Completed'
                        }
                    }
                }

                updateStatus(state.allAssignments)
                updateStatus(state.myDepartmentAssignments)
                updateStatus(state.assignments)
            })
            .addCase(updateAssignmentStatus.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Remove assignment
        builder
            .addCase(removeAssignment.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(removeAssignment.fulfilled, (state, action) => {
                state.loading = false
                const id = action.payload
                state.allAssignments = state.allAssignments.filter(a => a.id !== id)
                state.myDepartmentAssignments = state.myDepartmentAssignments.filter(a => a.id !== id)
                state.assignments = state.assignments.filter(a => a.id !== id)
            })
            .addCase(removeAssignment.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch statistics
        builder
            .addCase(fetchDepartmentStatistics.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDepartmentStatistics.fulfilled, (state, action) => {
                state.loading = false
                state.statistics = action.payload
            })
            .addCase(fetchDepartmentStatistics.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch admin dashboard stats
        builder
            .addCase(fetchAdminDashboardStats.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchAdminDashboardStats.fulfilled, (state, action) => {
                state.loading = false
                state.adminDashboardStats = action.payload
            })
            .addCase(fetchAdminDashboardStats.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const { setFilters, clearFilters } = assignmentsSlice.actions

// Selectors
export const selectAllAssignments = (state) => {
    const { allAssignments, filters } = state.assignments
    let filtered = allAssignments

    if (filters.status) {
        filtered = filtered.filter(a => a.status === filters.status)
    }

    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        filtered = filtered.filter(a =>
            (a.documentTitle && a.documentTitle.toLowerCase().includes(term)) ||
            (a.assignedToUserName && a.assignedToUserName.toLowerCase().includes(term)) ||
            (a.departmentName && a.departmentName.toLowerCase().includes(term))
        )
    }

    return filtered
}

export const selectMyDepartmentAssignments = (state) => {
    const { myDepartmentAssignments, filters } = state.assignments
    let filtered = myDepartmentAssignments

    if (filters.status) {
        filtered = filtered.filter(a => a.status === filters.status)
    }

    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        filtered = filtered.filter(a =>
            (a.documentTitle && a.documentTitle.toLowerCase().includes(term)) ||
            (a.assignedToUserName && a.assignedToUserName.toLowerCase().includes(term)) ||
            (a.departmentName && a.departmentName.toLowerCase().includes(term))
        )
    }

    return filtered
}

export const selectAssignmentsLoading = (state) => state.assignments.loading
export const selectAssignmentsError = (state) => state.assignments.error
export const selectStatistics = (state) => state.assignments.statistics
export const selectAdminDashboardStats = (state) => state.assignments.adminDashboardStats

export default assignmentsSlice.reducer
