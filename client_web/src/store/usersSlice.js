import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as usersApi from '../api/usersApi'
import toast from 'react-hot-toast'
import i18n from '../i18n'

// Async thunks
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (params, { rejectWithValue }) => {
        try {
            return await usersApi.getUsers(params)
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const fetchUserById = createAsyncThunk(
    'users/fetchUserById',
    async (id, { rejectWithValue }) => {
        try {
            return await usersApi.getUserById(id)
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const createUser = createAsyncThunk(
    'users/createUser',
    async (userData, { rejectWithValue }) => {
        try {
            const result = await usersApi.createUser(userData)
            toast.success(i18n.t('users.createSuccess'))
            return result
        } catch (error) {
            const message = error.response?.data?.message ||
                (error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0] : null) ||
                i18n.t('users.createFailed');
            return rejectWithValue(message)
        }
    }
)

export const updateUser = createAsyncThunk(
    'users/updateUser',
    async ({ id, userData }, { rejectWithValue }) => {
        try {
            const result = await usersApi.updateUser(id, userData)
            toast.success(i18n.t('users.updateSuccess'))
            return { id, data: result }
        } catch (error) {
            const message = error.response?.data?.message ||
                (error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0] : null) ||
                i18n.t('users.updateFailed');
            return rejectWithValue(message)
        }
    }
)

export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (id, { rejectWithValue }) => {
        try {
            await usersApi.deleteUser(id)
            toast.success(i18n.t('users.deleteSuccess'))
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('users.deleteFailed'))
        }
    }
)

export const changeUserPassword = createAsyncThunk(
    'users/changeUserPassword',
    async ({ id, passwordData }, { rejectWithValue }) => {
        try {
            await usersApi.changeUserPassword(id, passwordData)
            toast.success(i18n.t('profile.passwordChangeSuccess'))
            return id
        } catch (error) {
            const message = error.response?.data?.message || i18n.t('profile.passwordChangeFailed')
            return rejectWithValue(message)
        }
    }
)

export const changeMyPassword = createAsyncThunk(
    'users/changeMyPassword',
    async (passwordData, { rejectWithValue }) => {
        try {
            await usersApi.changeMyPassword(passwordData)
            toast.success(i18n.t('profile.passwordChangeSuccess'))
            return true
        } catch (error) {
            const message = error.response?.data?.message || i18n.t('profile.passwordChangeFailed')
            return rejectWithValue(message)
        }
    }
)

export const fetchUsersByDepartment = createAsyncThunk(
    'users/fetchUsersByDepartment',
    async (departmentId, { rejectWithValue }) => {
        try {
            return await usersApi.getUsersByDepartment(departmentId)
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

const usersSlice = createSlice({
    name: 'users',
    initialState: {
        users: [],
        selectedUser: null,
        loading: false,
        error: null,
        filters: {
            search: '',
            role: '',
            departmentId: '',
            isActive: null,
        },
        pagination: {
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 1,
        },
    },
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
        },
        clearFilters: (state) => {
            state.filters = {
                search: '',
                role: '',
                departmentId: '',
                isActive: null,
            }
        },
        setSelectedUser: (state, action) => {
            state.selectedUser = action.payload
        },
        clearSelectedUser: (state) => {
            state.selectedUser = null
        },
        setPage: (state, action) => {
            state.pagination.pageNumber = action.payload
        },
        setPageSize: (state, action) => {
            state.pagination.pageSize = action.payload
            state.pagination.pageNumber = 1 // Reset to first page when page size changes
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch users
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false
                state.users = action.payload.items
                state.pagination = {
                    totalCount: action.payload.totalCount,
                    pageNumber: action.payload.pageNumber,
                    pageSize: action.payload.pageSize,
                    totalPages: action.payload.totalPages,
                }
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Fetch user by ID
            .addCase(fetchUserById.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchUserById.fulfilled, (state, action) => {
                state.loading = false
                state.selectedUser = action.payload
            })
            .addCase(fetchUserById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Create user
            .addCase(createUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false
                state.users.push(action.payload)
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Update user
            .addCase(updateUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false
                const index = state.users.findIndex((u) => u.id === action.payload.id)
                if (index !== -1) {
                    state.users[index] = action.payload.data
                }
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Delete user
            .addCase(deleteUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.loading = false
                state.users = state.users.filter((u) => u.id !== action.payload)
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Change password
            .addCase(changeUserPassword.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(changeUserPassword.fulfilled, (state) => {
                state.loading = false
            })
            .addCase(changeUserPassword.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Change my password
            .addCase(changeMyPassword.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(changeMyPassword.fulfilled, (state) => {
                state.loading = false
            })
            .addCase(changeMyPassword.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Fetch users by department
            .addCase(fetchUsersByDepartment.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchUsersByDepartment.fulfilled, (state, action) => {
                state.loading = false
                state.users = action.payload
            })
            .addCase(fetchUsersByDepartment.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const { setFilters, clearFilters, setSelectedUser, clearSelectedUser, setPage, setPageSize } = usersSlice.actions

// Selectors
export const selectAllUsers = (state) => state.users.users
export const selectSelectedUser = (state) => state.users.selectedUser
export const selectUsersLoading = (state) => state.users.loading
export const selectUsersError = (state) => state.users.error
export const selectUsersFilters = (state) => state.users.filters
export const selectUsersPagination = (state) => state.users.pagination

export const selectFilteredUsers = (state) => state.users.users

export default usersSlice.reducer
