import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getRoles, createRole, updateRole, deleteRole } from '../api/rolesApi'
import i18n from '../i18n'
import toast from 'react-hot-toast'

export const fetchRoles = createAsyncThunk(
    'roles/fetchRoles',
    async (params, { rejectWithValue }) => {
        try {
            const data = await getRoles(params)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const addRole = createAsyncThunk(
    'roles/addRole',
    async (roleData, { rejectWithValue }) => {
        try {
            const data = await createRole(roleData)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('roles.messages.createFailed'))
        }
    }
)

export const editRole = createAsyncThunk(
    'roles/editRole',
    async ({ id, roleData }, { rejectWithValue }) => {
        try {
            await updateRole(id, roleData)
            return { id, ...roleData }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('roles.messages.updateFailed'))
        }
    }
)

export const removeRole = createAsyncThunk(
    'roles/removeRole',
    async (id, { rejectWithValue }) => {
        try {
            await deleteRole(id)
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('roles.messages.deleteFailed'))
        }
    }
)

const initialState = {
    items: [],
    loading: false,
    error: null,
    pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
    },
}

const rolesSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.loading = false
                state.items = action.payload.items || []
                state.pagination = {
                    page: action.payload.pageNumber || 1,
                    pageSize: action.payload.pageSize || state.pagination.pageSize,
                    total: action.payload.totalCount || 0,
                    totalPages: action.payload.totalPages || 1,
                }
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Add Role
            .addCase(addRole.pending, (state) => {
                state.loading = true
            })
            .addCase(addRole.fulfilled, (state, action) => {
                state.loading = false
                state.items.push(action.payload)
            })
            .addCase(addRole.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Edit Role
            .addCase(editRole.pending, (state) => {
                state.loading = true
            })
            .addCase(editRole.fulfilled, (state, action) => {
                state.loading = false
                const index = state.items.findIndex(role => role.id === action.payload.id)
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...action.payload }
                }
            })
            .addCase(editRole.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Remove Role
            .addCase(removeRole.pending, (state) => {
                state.loading = true
            })
            .addCase(removeRole.fulfilled, (state, action) => {
                state.loading = false
                state.items = state.items.filter(role => role.id !== action.payload)
            })
            .addCase(removeRole.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const selectAllRoles = (state) => state.roles.items
export const selectRolesLoading = (state) => state.roles.loading
export const selectRolesError = (state) => state.roles.error

export default rolesSlice.reducer
