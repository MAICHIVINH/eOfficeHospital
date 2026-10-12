import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authApi from '../api/authApi'
import { STORAGE_KEYS } from '../utils/constants'
import i18n from '../i18n'

// Initial state
const initialState = {
    user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || null,
    token: localStorage.getItem(STORAGE_KEYS.TOKEN) || null,
    isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
    loading: false,
    error: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await authApi.login(credentials)

            // Store token and user in localStorage
            localStorage.setItem(STORAGE_KEYS.TOKEN, data.token)
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))

            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('auth.loginFailed'))
        }
    }
)

export const fetchCurrentUser = createAsyncThunk(
    'auth/fetchCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const data = await authApi.getCurrentUser()

            // Update user in localStorage
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user || data))

            return data.user || data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const refreshUserPermissions = createAsyncThunk(
    'auth/refreshPermissions',
    async (_, { rejectWithValue }) => {
        try {
            const data = await authApi.refreshToken()

            // Store new token and updated user in localStorage
            localStorage.setItem(STORAGE_KEYS.TOKEN, data.token)
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))

            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.error'))
        }
    }
)

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        // No API call - backend doesn't have logout endpoint
        // Just clear localStorage
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)

        return null
    }
)

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload
            state.isAuthenticated = !!action.payload

            if (action.payload) {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload))
            }
        },
        clearAuth: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.error = null

            localStorage.removeItem(STORAGE_KEYS.TOKEN)
            localStorage.removeItem(STORAGE_KEYS.USER)
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.token = action.payload.token
                state.isAuthenticated = true
                state.error = null
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
                state.isAuthenticated = false
            })

        // Fetch current user
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload
                state.isAuthenticated = true
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
                state.isAuthenticated = false
                state.user = null
                state.token = null
            })

        // Refresh permissions
        builder
            .addCase(refreshUserPermissions.pending, (state) => {
                state.loading = true
            })
            .addCase(refreshUserPermissions.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.token = action.payload.token
                state.isAuthenticated = true
            })
            .addCase(refreshUserPermissions.rejected, (state) => {
                state.loading = false
            })

        // Logout
        builder
            .addCase(logoutUser.pending, (state) => {
                state.loading = true
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false
                state.user = null
                state.token = null
                state.isAuthenticated = false
                state.error = null
            })
    },
})

export const { setUser, clearAuth } = authSlice.actions
export default authSlice.reducer
