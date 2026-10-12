import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleGuard from './RoleGuard'
import { ROLES, PERMISSIONS } from '../utils/constants'

// Layouts
import MainLayout from '../layouts/MainLayout'

// Pages
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import DocumentsPage from '../pages/DocumentsPage'
import UsersPage from '../pages/UsersPage'
import DepartmentsPage from '../pages/DepartmentsPage'
import AssignmentsPage from '../pages/AssignmentsPage'
import AuditLogsPage from '../pages/AuditLogsPage'
import PermissionsPage from '../pages/PermissionsPage'
import RolesPage from '../pages/RolesPage'
import ProfilePage from '../pages/ProfilePage'
import NotificationManagementPage from '../pages/NotificationManagementPage'
import NotFoundPage from '../pages/NotFoundPage'
import OutgoingDocumentsPage from '../pages/OutgoingDocumentsPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import TrashPage from '../pages/TrashPage'
import IncomingArchivePage from '../pages/IncomingArchivePage'
import OutgoingArchivePage from '../pages/OutgoingArchivePage'
import IssuingAgenciesPage from '../pages/IssuingAgenciesPage'

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Protected routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                {/* Dashboard - All roles */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Documents - All roles */}
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="documents/view/:id" element={<DocumentsPage />} />

                {/* Issuing Agencies - IssuingAgencies.View permission */}
                <Route
                    path="issuing-agencies"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.ISSUING_AGENCIES_VIEW]}>
                            <IssuingAgenciesPage />
                        </RoleGuard>
                    }
                />


                {/* Outgoing Documents - Documents.View permission */}
                <Route
                    path="outgoing-documents"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS_VIEW]}>
                            <OutgoingDocumentsPage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="outgoing-documents/view/:id"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS_VIEW]}>
                            <OutgoingDocumentsPage />
                        </RoleGuard>
                    }
                />
                {/* <Route
                    path="outgoing-documents/:id"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS_VIEW]}>
                            <OutgoingDocumentDetailPage />
                        </RoleGuard>
                    }
                /> */}

                {/* Profile - All roles */}
                <Route path="profile" element={<ProfilePage />} />


                {/* Users - Users.View permission */}
                <Route
                    path="users"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.USERS_VIEW]}>
                            <UsersPage />
                        </RoleGuard>
                    }
                />

                {/* Departments - Departments.View permission */}
                <Route
                    path="departments"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DEPARTMENTS_VIEW]}>
                            <DepartmentsPage />
                        </RoleGuard>
                    }
                />

                {/* Assignments - Documents.View permission */}
                <Route
                    path="assignments"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS_VIEW]}>
                            <AssignmentsPage />
                        </RoleGuard>
                    }
                />

                {/* Roles Management - Roles.View permission */}
                <Route
                    path="roles"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.ROLES_VIEW]}>
                            <RolesPage />
                        </RoleGuard>
                    }
                />

                {/* Permissions Matrix - Roles.AssignPermissions permission */}
                <Route
                    path="permissions"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.ROLES_ASSIGN_PERMISSIONS]}>
                            <PermissionsPage />
                        </RoleGuard>
                    }
                />

                {/* Audit Logs - AuditLogs.View permission */}
                <Route
                    path="audit-logs"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.AUDIT_LOGS_VIEW]}>
                            <AuditLogsPage />
                        </RoleGuard>
                    }
                />

                {/* Notification Management - Notifications.View permission */}
                <Route
                    path="notification-management"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.NOTIFICATIONS_VIEW]}>
                            <NotificationManagementPage />
                        </RoleGuard>
                    }
                />

                {/* Trash Bin - ADMIN only or specific perms */}
                <Route
                    path="trash"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS_DELETE, PERMISSIONS.USERS_DELETE, PERMISSIONS.DEPARTMENTS_DELETE]}>
                            <TrashPage />
                        </RoleGuard>
                    }
                />

                {/* Incoming Archive - Documents.View permission */}
                <Route
                    path="incoming-archive"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS_ARCHIVE]}>
                            <IncomingArchivePage />
                        </RoleGuard>
                    }
                />
                <Route
                    path="outgoing-archive"
                    element={
                        <RoleGuard requiredPermissions={[PERMISSIONS.DOCUMENTS_ARCHIVE]}>
                            <OutgoingArchivePage />
                        </RoleGuard>
                    }
                />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default AppRoutes
