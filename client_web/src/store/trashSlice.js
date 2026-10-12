import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import trashApi from '../api/trashApi'
import { toast } from 'react-hot-toast'

export const fetchDeletedItems = createAsyncThunk(
    'trash/fetchDeletedItems',
    async (entityType, { rejectWithValue }) => {
        try {
            let response
            switch (entityType) {
                case 'document': response = await trashApi.getDeletedDocuments(); break;
                case 'user': response = await trashApi.getDeletedUsers(); break;
                case 'department': response = await trashApi.getDeletedDepartments(); break;
                case 'assignment': response = await trashApi.getDeletedAssignments(); break;
                case 'role': response = await trashApi.getDeletedRoles(); break;
                case 'auditlog': response = await trashApi.getDeletedAuditLogs(); break;
                default: throw new Error('Invalid entity type')
            }
            return { entityType, items: response.data }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch deleted items')
        }
    }
)

export const restoreItem = createAsyncThunk(
    'trash/restoreItem',
    async ({ entityType, id }, { rejectWithValue }) => {
        try {
            await trashApi.restoreItem(entityType, id)
            toast.success('Khôi phục thành công')
            return { entityType, id }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Khôi phục thất bại')
            return rejectWithValue(error.response?.data?.message || 'Restore failed')
        }
    }
)

export const permanentDeleteItem = createAsyncThunk(
    'trash/permanentDeleteItem',
    async ({ entityType, id }, { rejectWithValue }) => {
        try {
            await trashApi.permanentDelete(entityType, id)
            toast.success('Xóa mục thành công')
            return { entityType, id }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa mục thất bại')
            return rejectWithValue(error.response?.data?.message || 'Delete failed')
        }
    }
)

export const bulkPermanentDeleteItem = createAsyncThunk(
    'trash/bulkPermanentDeleteItem',
    async ({ entityType, ids }, { rejectWithValue }) => {
        try {
            const response = await trashApi.bulkPermanentDelete(entityType, ids)
            toast.success(response.data.message || 'Các mục đã được xóa vĩnh viễn')
            return { entityType, ids }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa mục thất bại')
            return rejectWithValue(error.response?.data?.message || 'Bulk delete failed')
        }
    }
)

const trashSlice = createSlice({
    name: 'trash',
    initialState: {
        documents: [],
        users: [],
        departments: [],
        assignments: [],
        roles: [],
        auditlogs: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDeletedItems.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDeletedItems.fulfilled, (state, action) => {
                const { entityType, items } = action.payload
                state[`${entityType}s`] = items
                state.loading = false
            })
            .addCase(fetchDeletedItems.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(restoreItem.fulfilled, (state, action) => {
                const { entityType, id } = action.payload
                state[`${entityType}s`] = state[`${entityType}s`].filter(item => item.id !== id)
            })
            .addCase(permanentDeleteItem.fulfilled, (state, action) => {
                const { entityType, id } = action.payload
                state[`${entityType}s`] = state[`${entityType}s`].filter(item => item.id !== id)
            })
            .addCase(bulkPermanentDeleteItem.fulfilled, (state, action) => {
                const { entityType, ids } = action.payload
                const idSet = new Set(ids)
                state[`${entityType}s`] = state[`${entityType}s`].filter(item => !idSet.has(item.id))
            })
    }
})

export default trashSlice.reducer
