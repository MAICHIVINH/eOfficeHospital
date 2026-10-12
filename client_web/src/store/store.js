import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import documentsReducer from './documentsSlice'
import usersReducer from './usersSlice'
import departmentsReducer from './departmentsSlice'
import assignmentsReducer from './assignmentsSlice'

import auditLogsReducer from './auditLogsSlice'
import rolesReducer from './rolesSlice'
import trashReducer from './trashSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        documents: documentsReducer,
        users: usersReducer,
        departments: departmentsReducer,
        assignments: assignmentsReducer,
        auditLogs: auditLogsReducer,
        roles: rolesReducer,
        trash: trashReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['auth/login/fulfilled'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
                // Ignore these paths in the state
                ignoredPaths: ['items.dates'],
            },
        }),
})

export default store
