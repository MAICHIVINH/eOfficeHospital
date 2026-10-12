# Hospital E-Office - Frontend Application

Giao diện người dùng cho Hệ thống quản lý văn bản điện tử bệnh viện, được xây dựng bằng React 18 + Vite.

---

## Mục lục

- [Công nghệ](#công-nghệ)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Tính năng](#tính-năng)
- [Scripts](#scripts)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)

---

## Công nghệ

### Core
- **React 18.3** - UI Library
- **Vite 5.4** - Build tool & Dev server (Lightning fast HMR)
- **React Router v6** - Client-side routing

### State Management
- **Redux Toolkit** - Global state management
- **Redux Persist** - Persist state to localStorage

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Toast notifications

### Data & API
- **Axios** - HTTP client với interceptors
- **date-fns** - Date formatting và manipulation

### Charts & Visualization
- **Recharts** - Charting library cho Dashboard

### Internationalization
- **react-i18next** - i18n framework
- **i18next** - Translation management

### Real-time
- **@microsoft/signalr** - SignalR client cho real-time notifications

---

## Yêu cầu hệ thống

- **Node.js**: >= 16.x (khuyến nghị 18.x hoặc 20.x)
- **npm**: >= 8.x
- **Backend API**: Phải chạy tại `http://localhost:5020/api`

---

## Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd e-OfficeHospital_v1/client_web
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Tạo file cấu hình
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

### 4. Chạy development server
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

---

## Cấu hình

### Environment Variables

Tạo file `.env` trong thư mục `client_web/`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5020/api

# App Configuration
VITE_APP_NAME=Hospital E-Office System

# Optional: SignalR Hub URL (nếu khác với API base URL)
VITE_SIGNALR_HUB_URL=http://localhost:5020/notificationHub
```

### Axios Configuration

File `src/api/axiosInstance.js` đã được cấu hình với:
- Base URL từ environment variable
- Request interceptor để thêm JWT token
- Response interceptor để xử lý lỗi 401 (auto logout)
- Timeout: 30 seconds

---

## Cấu trúc thư mục

```
client_web/
├── public/                      # Static assets
│   └── vite.svg
│
├── src/
│   ├── api/                    # API Services Layer
│   │   ├── axiosInstance.js   # Axios configuration với interceptors
│   │   ├── authApi.js         # Authentication APIs
│   │   ├── documentsApi.js    # Documents APIs
│   │   ├── usersApi.js        # Users APIs
│   │   ├── departmentsApi.js  # Departments APIs
│   │   ├── rolesApi.js        # Roles APIs
│   │   ├── permissionsApi.js  # Permissions APIs
│   │   ├── assignmentsApi.js  # Assignments APIs
│   │   ├── auditLogsApi.js    # Audit Logs APIs
│   │   ├── notificationsApi.js # Notifications APIs
│   │   ├── trashApi.js        # Trash APIs
│   │   └── outgoingApi.js     # Outgoing Document Workflow APIs
│   │
│   ├── components/             # Reusable Components
│   │   ├── common/            # Common UI Components
│   │   │   ├── Badge.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Pagination.jsx
│   │   │
│   │   └── documents/         # Document-specific Components
│   │       ├── DocumentAssignModal.jsx
│   │       ├── DocumentDetailModal.jsx
│   │       ├── DocumentForm.jsx
│   │       ├── IncomingDocumentForm.jsx
│   │       ├── OutgoingDocumentForm.jsx
│   │       ├── RejectDocumentModal.jsx
│   │       └── WorkflowActionModal.jsx
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useAuth.js         # Authentication hook
│   │   └── usePermission.js   # Permission checking hook
│   │
│   ├── layouts/                # Layout Components
│   │   ├── Header.jsx         # Top header với notifications
│   │   ├── MainLayout.jsx     # Main layout wrapper
│   │   └── Sidebar.jsx        # Sidebar navigation
│   │
│   ├── locales/                # i18n Translation Files
│   │   ├── en.json            # English translations
│   │   └── vi.json            # Vietnamese translations
│   │
│   ├── pages/                  # Page Components
│   │   ├── AssignmentsPage.jsx
│   │   ├── AuditLogsPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DepartmentsPage.jsx
│   │   ├── IncomingDocumentsPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── NotFoundPage.jsx
│   │   ├── NotificationManagementPage.jsx
│   │   ├── OutgoingDocumentsPage.jsx
│   │   ├── PermissionsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── RolesPage.jsx
│   │   ├── TrashPage.jsx
│   │   └── UsersPage.jsx
│   │
│   ├── routes/                 # Routing Configuration
│   │   ├── index.jsx          # Main routes configuration
│   │   ├── ProtectedRoute.jsx # Authentication guard
│   │   └── RoleGuard.jsx      # Permission-based guard
│   │
│   ├── store/                  # Redux Store
│   │   ├── store.js           # Store configuration
│   │   ├── authSlice.js       # Auth state
│   │   ├── documentsSlice.js  # Documents state
│   │   ├── usersSlice.js      # Users state
│   │   ├── departmentsSlice.js # Departments state
│   │   ├── rolesSlice.js      # Roles state
│   │   ├── permissionsSlice.js # Permissions state
│   │   ├── assignmentsSlice.js # Assignments state
│   │   ├── auditLogsSlice.js  # Audit Logs state
│   │   ├── notificationsSlice.js # Notifications state
│   │   ├── themeSlice.js      # Theme (dark/light) state
│   │   └── languageSlice.js   # Language state
│   │
│   ├── utils/                  # Utility Functions
│   │   ├── constants.js       # App constants
│   │   ├── formatters.js      # Date, number formatters
│   │   ├── permissions.js     # Permission constants
│   │   └── validators.js      # Form validators
│   │
│   ├── App.jsx                 # Main App Component
│   ├── i18n.js                 # i18n Configuration
│   ├── index.css               # Global CSS + Tailwind
│   └── main.jsx                # Entry Point
│
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
├── .gitignore
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML template
├── package.json                # Dependencies
├── postcss.config.js           # PostCSS configuration
├── README.md                   # This file
├── tailwind.config.js          # Tailwind CSS configuration
└── vite.config.js              # Vite configuration
```

---

## Tính năng

### Authentication & Authorization
- Login với JWT
- Logout
- Forgot Password (Email verification)
- Change Password
- Profile Management
- Role-Based Access Control (RBAC)
- Permission-based UI rendering
- Auto logout on token expiration

### Document Management
- Incoming Documents (Văn bản đến):
  + Upload PDF
  + View, Edit, Delete
  + Search & Filter
  + Pagination
  + Preview PDF
  + Download
  + Assign to departments
- Outgoing Documents (Văn bản đi):
  + 8-step workflow (Draft → Archive)
  + Reject with reason
  + Document number assignment
  + Workflow history tracking

### User & Department Management
- Users CRUD
- Departments CRUD
- Role assignment
- Search & Filter
- Pagination
- Protect Admin account
- Protect current user account

### Roles & Permissions
- Roles CRUD
- Permissions Matrix
- Assign permissions to roles
- Dynamic permission checking
- Category-based permission grouping

### Dashboard & Statistics
- System overview statistics
- User activity charts
- Document view history (Clerk tracking)
- Time-based filtering
- Recharts integration

### Notifications
- Real-time notifications (SignalR)
- Notification center
- Mark as read
- Notification types (Assignment, Rejection, Signature, etc.)
- Admin notification management

### Trash Management
- Soft delete for all entities
- Restore deleted items
- Permanent delete (Admin only)
- Separate tabs for each entity type

### UI/UX Features
- Dark/Light mode toggle
- Responsive design (Mobile, Tablet, Desktop)
- Loading states
- Error handling
- Toast notifications
- Confirm modals
- Form validation
- Pagination
- Search & Filter
- Tooltips

### Internationalization
- Vietnamese (default)
- English
- Language switcher
- Persistent language preference

---

## Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)

# Build
npm run build            # Build for production (output: dist/)

# Preview
npm run preview          # Preview production build

# Lint
npm run lint             # Run ESLint
```

---

## Hướng dẫn sử dụng

### 1. Đăng nhập
1. Truy cập `http://localhost:5173`
2. Nhập username và password
3. Hệ thống tự động redirect theo role

**Tài khoản mặc định**:
- Admin: `admin` / `Admin@123`
- Manager: `manager1` / `Manager@123`
- Staff: `staff1` / `Staff@123`
- Clerk: `clerk1` / `Clerk@123`
- Director: `director1` / `Director@123`

### 2. Dashboard
- Xem thống kê tổng quan
- Theo dõi hoạt động gần đây
- Xem biểu đồ (Admin/Manager)

### 3. Quản lý Văn bản Đến
1. Vào menu "Văn bản đến"
2. Click "Đăng tải hồ sơ" để upload văn bản mới
3. Điền thông tin và chọn file PDF
4. Click "Phân công" để gán cho phòng ban
5. Theo dõi trạng thái xử lý

### 4. Quản lý Văn bản Đi
1. Vào menu "Văn bản đi"
2. Click "Soạn thảo văn bản đi"
3. Thực hiện các bước workflow:
   - Soạn thảo (Staff/Manager)
   - Duyệt nội dung (Manager)
   - Kiểm tra thể thức (Clerk)
   - Trình ký (Clerk)
   - Ký duyệt (Director)
   - Cấp số (Clerk)
   - Phát hành (Clerk)
   - Lưu trữ (System)

### 5. Phân quyền (Admin)
1. Vào "Ma trận Phân quyền"
2. Xem bảng quyền theo vai trò
3. Click vào checkbox để gán/bỏ quyền
4. Click "Lưu thay đổi"

### 6. Thông báo
- Click icon chuông ở header
- Xem danh sách thông báo
- Click để đánh dấu đã đọc
- Thông báo real-time khi có sự kiện mới

### 7. Đổi ngôn ngữ
- Click icon cờ ở header
- Chọn Tiếng Việt hoặc English

### 8. Dark/Light Mode
- Click icon mặt trời/mặt trăng ở header
- Theme được lưu tự động

---

## Customization

### Tailwind CSS

Cấu hình trong `tailwind.config.js`:

```js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { /* custom colors */ },
        // ...
      }
    }
  }
}
```

### i18n

Thêm translation mới trong `src/locales/`:

```json
// vi.json
{
  "newFeature": {
    "title": "Tiêu đề mới",
    "description": "Mô tả"
  }
}

// en.json
{
  "newFeature": {
    "title": "New Title",
    "description": "Description"
  }
}
```

Sử dụng trong component:

```jsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('newFeature.title')}</h1>
}
```

---

## Troubleshooting

### Lỗi kết nối API
**Triệu chứng**: Không load được dữ liệu, lỗi network

**Giải pháp**:
1. Kiểm tra backend đang chạy: `http://localhost:5020/swagger`
2. Kiểm tra `.env` file có đúng `VITE_API_BASE_URL`
3. Kiểm tra CORS configuration ở backend
4. Xem console browser để biết chi tiết lỗi

### Lỗi authentication
**Triệu chứng**: Bị logout liên tục, token invalid

**Giải pháp**:
1. Xóa localStorage: `localStorage.clear()`
2. Đăng nhập lại
3. Kiểm tra JWT secret key ở backend
4. Kiểm tra token expiration time

### Lỗi build
**Triệu chứng**: `npm run build` failed

**Giải pháp**:
1. Xóa `node_modules` và `package-lock.json`
2. Chạy lại `npm install`
3. Kiểm tra Node.js version >= 16
4. Xem error log chi tiết

### Lỗi SignalR
**Triệu chứng**: Không nhận được thông báo real-time

**Giải pháp**:
1. Kiểm tra backend SignalR hub đang chạy
2. Kiểm tra `VITE_SIGNALR_HUB_URL` trong `.env`
3. Xem console browser để biết connection status
4. Thử refresh lại trang

---

## Performance

### Build Size
- **Vite** tối ưu code splitting tự động
- **Lazy loading** cho routes
- **Tree shaking** loại bỏ code không dùng
- **Minification** và compression

### Best Practices
- Code splitting by routes
- Lazy loading components
- Memoization với `useMemo`, `useCallback`
- Debounce search inputs
- Pagination thay vì load all
- Image optimization
- CSS purging với Tailwind

---

## Security

### Frontend Security Measures
- JWT token stored in localStorage (với httpOnly cookie là tốt hơn)
- Auto logout on token expiration
- CSRF protection (backend)
- XSS prevention (React auto-escaping)
- Input validation
- Permission-based UI rendering
- Secure API calls với HTTPS (production)

---

## Resources

### Documentation
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [i18next](https://www.i18next.com/)

### Icons
- [Lucide Icons](https://lucide.dev/)

---

## Developer

**Mai Chí Vĩnh**
- Hospital: Bệnh viện Đa khoa Tâm Trí Cao Lãnh

---

**Built with React + Vite**

*Cập nhật lần cuối: 03/02/2026*
