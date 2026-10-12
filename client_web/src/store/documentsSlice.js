import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import documentsApi from '../api/documentsApi'
import i18n from '../i18n'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
    documents: [],
    currentDocument: null,
    statistics: null,
    loading: false,
    error: null,
    filters: {
        search: '',
        type: '',
        department: '',
        status: '',
        dateFrom: '',
        dateTo: '',
    },
    pagination: {
        pageNumber: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
    },
}

// Async thunks
export const fetchDocuments = createAsyncThunk(
    'documents/fetchDocuments',
    async (params, { getState, rejectWithValue }) => {
        try {
            const { filters, pagination } = getState().documents

            const queryParams = {
                ...filters,
                pageNumber: params?.pageNumber || params?.page || pagination.pageNumber,
                pageSize: params?.pageSize || pagination.pageSize,
                ...params,
            }

            const data = await documentsApi.getDocuments(queryParams)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const fetchDocumentById = createAsyncThunk(
    'documents/fetchDocumentById',
    async (id, { rejectWithValue }) => {
        try {
            const data = await documentsApi.getDocumentById(id)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

export const uploadDocument = createAsyncThunk(
    'documents/uploadDocument',
    async (formData, { rejectWithValue }) => {
        try {
            const data = await documentsApi.createDocument(formData)
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('documents.uploadFailed'))
        }
    }
)

export const updateDocumentData = createAsyncThunk(
    'documents/updateDocument',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const result = await documentsApi.updateDocument(id, data)
            return result
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('documents.updateFailed'))
        }
    }
)

export const removeDocument = createAsyncThunk(
    'documents/removeDocument',
    async (id, { rejectWithValue }) => {
        try {
            await documentsApi.deleteDocument(id)
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('documents.deleteFailed'))
        }
    }
)

export const assignDocumentToDepartments = createAsyncThunk(
    'documents/assignDocument',
    async ({ id, processingDeadline, assignmentData }, { rejectWithValue }) => {
        try {
            const data = await documentsApi.assignDocument(id, {
                processingDeadline,
                assignments: assignmentData
            })
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('assignments.assignFailed'))
        }
    }
)

export const fetchDocumentStatistics = createAsyncThunk(
    'documents/fetchStatistics',
    async (_, { rejectWithValue }) => {
        try {
            const data = await documentsApi.getStatistics()
            return data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || i18n.t('common.messages.loadFailed'))
        }
    }
)

// Slice
const documentsSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
        },
        resetFilters: (state) => {
            state.filters = initialState.filters
        },
        setCurrentDocument: (state, action) => {
            state.currentDocument = action.payload
        },
        clearCurrentDocument: (state) => {
            state.currentDocument = null
        },
        setPagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload }
        },
    },
    extraReducers: (builder) => {
        // Fetch documents
        builder
            .addCase(fetchDocuments.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDocuments.fulfilled, (state, action) => {
                state.loading = false
                // Backend now returns { items: [], totalCount, pageNumber, pageSize, totalPages }
                state.documents = action.payload.items || []
                state.pagination = {
                    pageNumber: action.payload.pageNumber || 1,
                    pageSize: action.payload.pageSize || state.pagination.pageSize,
                    total: action.payload.totalCount || 0,
                    totalPages: action.payload.totalPages || 1,
                }
            })
            .addCase(fetchDocuments.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch document by ID
        builder
            .addCase(fetchDocumentById.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchDocumentById.fulfilled, (state, action) => {
                state.loading = false
                state.currentDocument = action.payload.document || action.payload
            })
            .addCase(fetchDocumentById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Upload document
        builder
            .addCase(uploadDocument.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(uploadDocument.fulfilled, (state, action) => {
                state.loading = false
                state.documents.unshift(action.payload.document || action.payload)
            })
            .addCase(uploadDocument.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Update document
        builder
            .addCase(updateDocumentData.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateDocumentData.fulfilled, (state, action) => {
                state.loading = false
                const updatedDoc = action.payload.document || action.payload
                const index = state.documents.findIndex((doc) => doc.id === updatedDoc.id)
                if (index !== -1) {
                    state.documents[index] = updatedDoc
                }
                if (state.currentDocument?.id === updatedDoc.id) {
                    state.currentDocument = updatedDoc
                }
            })
            .addCase(updateDocumentData.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Remove document
        builder
            .addCase(removeDocument.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(removeDocument.fulfilled, (state, action) => {
                state.loading = false
                state.documents = state.documents.filter((doc) => doc.id !== action.payload)
                if (state.currentDocument?.id === action.payload) {
                    state.currentDocument = null
                }
            })
            .addCase(removeDocument.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Assign document
        builder
            .addCase(assignDocumentToDepartments.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(assignDocumentToDepartments.fulfilled, (state) => {
                state.loading = false
            })
            .addCase(assignDocumentToDepartments.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

        // Fetch statistics
        builder
            .addCase(fetchDocumentStatistics.pending, (state) => {
                state.error = null
            })
            .addCase(fetchDocumentStatistics.fulfilled, (state, action) => {
                state.statistics = action.payload
            })
            .addCase(fetchDocumentStatistics.rejected, (state, action) => {
                state.error = action.payload
            })
    },
})

export const {
    setFilters,
    resetFilters,
    setCurrentDocument,
    clearCurrentDocument,
    setPagination,
} = documentsSlice.actions

export default documentsSlice.reducer
