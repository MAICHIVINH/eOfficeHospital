import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as departmentsApi from '../api/departmentsApi'
import toast from 'react-hot-toast'
import i18n from '../i18n'

// Async thunks
export const fetchDepartments = createAsyncThunk(
    'departments/fetchDepartments',
    async (params, { rejectWithValue }) => {
        try {
            return await departmentsApi.getDepartments(params)
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const fetchDepartmentById = createAsyncThunk(
    'departments/fetchDepartmentById',
    async (id, { rejectWithValue }) => {
        try {
            return await departmentsApi.getDepartmentById(id)
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const createDepartment = createAsyncThunk(
    'departments/createDepartment',
    async (departmentData, { rejectWithValue }) => {
        try {
            const result = await departmentsApi.createDepartment(departmentData)
            toast.success(i18n.t('departments.createSuccess'))
            return result
        } catch (error) {
            const message = error.response?.data?.message || i18n.t('departments.createFailed')
            return rejectWithValue(message)
        }
    }
)

export const updateDepartment = createAsyncThunk(
    'departments/updateDepartment',
    async ({ id, departmentData }, { rejectWithValue }) => {
        try {
            const result = await departmentsApi.updateDepartment(id, departmentData)
            toast.success(i18n.t('departments.updateSuccess'))
            return { id, data: result }
        } catch (error) {
            const message = error.response?.data?.message || i18n.t('departments.updateFailed')
            return rejectWithValue(message)
        }
    }
)

export const deleteDepartment = createAsyncThunk(
    'departments/deleteDepartment',
    async (id, { rejectWithValue }) => {
        try {
            await departmentsApi.deleteDepartment(id)
            toast.success(i18n.t('departments.deleteSuccess'))
            return id
        } catch (error) {
            const message = error.response?.data?.message || i18n.t('departments.deleteFailed')
            return rejectWithValue(message)
        }
    }
)

const departmentsSlice = createSlice({
    name: 'departments',
    initialState: {
        departments: [],
        selectedDepartment: null,
        loading: false,
        error: null,
        pagination: {
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 1,
        },
    },
    reducers: {
        setSelectedDepartment: (state, action) => {
            state.selectedDepartment = action.payload
        },
        clearSelectedDepartment: (state) => {
            state.selectedDepartment = null
        },
        setPage: (state, action) => {
            state.pagination.pageNumber = action.payload
        },
        setPageSize: (state, action) => {
            state.pagination.pageSize = action.payload
            state.pagination.pageNumber = 1
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch departments
            .addCase(fetchDepartments.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDepartments.fulfilled, (state, action) => {
                state.loading = false
                state.departments = action.payload.items
                state.pagination = {
                    totalCount: action.payload.totalCount,
                    pageNumber: action.payload.pageNumber,
                    pageSize: action.payload.pageSize,
                    totalPages: action.payload.totalPages,
                }
            })
            .addCase(fetchDepartments.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Fetch department by ID
            .addCase(fetchDepartmentById.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDepartmentById.fulfilled, (state, action) => {
                state.loading = false
                state.selectedDepartment = action.payload
            })
            .addCase(fetchDepartmentById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Create department
            .addCase(createDepartment.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(createDepartment.fulfilled, (state, action) => {
                state.loading = false
                state.departments.push(action.payload)
            })
            .addCase(createDepartment.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Update department
            .addCase(updateDepartment.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateDepartment.fulfilled, (state, action) => {
                state.loading = false
                const index = state.departments.findIndex((d) => d.id === action.payload.id)
                if (index !== -1) {
                    state.departments[index] = action.payload.data
                }
            })
            .addCase(updateDepartment.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Delete department
            .addCase(deleteDepartment.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(deleteDepartment.fulfilled, (state, action) => {
                state.loading = false
                state.departments = state.departments.filter((d) => d.id !== action.payload)
            })
            .addCase(deleteDepartment.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const { setSelectedDepartment, clearSelectedDepartment, setPage, setPageSize } = departmentsSlice.actions

// Selectors
export const selectAllDepartments = (state) => state.departments.departments
export const selectSelectedDepartment = (state) => state.departments.selectedDepartment
export const selectDepartmentsLoading = (state) => state.departments.loading
export const selectDepartmentsError = (state) => state.departments.error
export const selectDepartmentsPagination = (state) => state.departments.pagination

export const selectActiveDepartments = (state) =>
    state.departments.departments.filter((dept) => dept.isActive !== false)

export default departmentsSlice.reducer
