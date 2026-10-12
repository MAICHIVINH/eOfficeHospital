import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import { loginUser, logoutUser, fetchCurrentUser } from '../store/authSlice'

/**
 * Custom hook for authentication
 * @returns {Object} Auth state and methods
 */
export const useAuth = () => {
    const dispatch = useDispatch()
    const { user, token, isAuthenticated, loading, error } = useSelector((state) => state.auth)

    const login = useCallback(
        async (credentials) => {
            const result = await dispatch(loginUser(credentials))
            return result
        },
        [dispatch]
    )

    const logout = useCallback(async () => {
        await dispatch(logoutUser())
    }, [dispatch])

    const refreshUser = useCallback(async () => {
        await dispatch(fetchCurrentUser())
    }, [dispatch])

    const refreshPermissions = useCallback(async () => {
        const result = await dispatch(refreshUserPermissions())
        return result
    }, [dispatch])

    return {
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        refreshUser,
        refreshPermissions,
    }
}

export default useAuth
