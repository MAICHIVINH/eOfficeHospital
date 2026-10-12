# Hospital E-Office Management System

> **Hệ thống Quản lý Văn bản & Điều hành Tác nghiệp Điện tử Bệnh viện**  
> Giải pháp số hóa quy trình luân chuyển công văn, tự động hóa luồng ký duyệt văn bản đi - đến và theo dõi nhiệm vụ tác nghiệp trong môi trường y tế.

[![.NET 9.0](https://img.shields.io/badge/.NET-9.0-purple.svg)](https://dotnet.microsoft.com/)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![MinIO](https://img.shields.io/badge/Storage-MinIO-red.svg)](https://min.io/)
[![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED.svg)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC.svg)](https://tailwindcss.com/)

---

## Mục lục

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Các tính năng chính](#2-các-tính-năng-chính)
   - [Quản lý Văn bản đến (Incoming Documents)](#21-quản-lý-văn-bản-đến-incoming-documents)
   - [Quản lý Văn bản đi (Outgoing Workflow 10 bước)](#22-quản-lý-văn-bản-đi-outgoing-workflow-10-bước)
   - [Quản lý Phân phối & Báo cáo kết quả](#23-quản-lý-phân-phối--báo-cáo-kết-quả)
   - [Quản lý Nhiệm vụ & Phân công (Assignments)](#24-quản-lý-nhiệm-vụ--phân-công-assignments)
   - [Quản lý Cơ quan ban hành (Issuing Agencies)](#25-quản-lý-cơ-quan-ban-hành-issuing-agencies)
   - [Kho lưu trữ điện tử (Archive)](#26-kho-lưu-trữ-điện-tử-archive)
   - [Phân quyền động (RBAC & Dynamic Permissions)](#27-phân-quyền-động-rbac--dynamic-permissions)
   - [Thông báo thời gian thực (Real-time SignalR)](#28-thông-báo-thời-gian-thực-real-time-signalr)
   - [Thùng rác & Phục hồi dữ liệu (Soft Delete)](#29-thùng-rác--phục-hồi-dữ-liệu-soft-delete)
   - [Nhật ký hệ thống & Kiểm toán (Audit Logs)](#210-nhật-ký-hệ-thống--kiểm-toán-audit-logs)
   - [Hỗ trợ mạng nội bộ & Chạy Offline](#211-hỗ-trợ-mạng-nội-bộ--chạy-offline)
3. [Kiến trúc hệ thống & Công nghệ](#3-kiến-trúc-hệ-thống--công-nghệ)
4. [Bản đồ cổng dịch vụ (Port Mapping)](#4-bản-đồ-cổng-dịch-vụ-port-mapping)
5. [Tài khoản mặc định](#5-tài-khoản-mặc-định)
6. [Hướng dẫn cài đặt và khởi chạy](#6-hướng-dẫn-cài-đặt-và-khởi-chạy)
   - [Phương án 1: Triển khai toàn bộ với Docker (Khuyến nghị cho Server)](#phương-án-1-triển-khai-toàn-bộ-với-docker-khuyến-nghị-cho-server)
   - [Phương án 2: Chạy từng phần trong môi trường phát triển (Local Dev)](#phương-án-2-chạy-từng-phần-trong-môi-trường-phát-triển-local-dev)
   - [Cấu hình IP máy chủ cho mạng LAN Bệnh viện](#cấu-hình-ip-máy-chủ-cho-mạng-lan-bệnh-viện)
7. [Cấu trúc thư mục dự án](#7-cấu-trúc-thư-mục-dự-án)
8. [Danh mục API Endpoints chính](#8-danh-mục-api-endpoints-chính)
9. [Tác giả & Thông tin liên hệ](#9-tác-giả--thông-tin-liên-hệ)

---

## 1. Giới thiệu tổng quan

**Hospital E-Office Management System** là hệ thống phần mềm quản lý văn bản, điều hành và tác nghiệp điện tử được thiết kế chuyên biệt cho môi trường Bệnh viện. Hệ thống giúp:
- **Số hóa toàn diện**: Chuyển đổi toàn bộ giấy tờ, công văn sang định dạng điện tử, loại bỏ nguy cơ thất lạc hồ sơ.
- **Quy trình chuẩn hóa**: Tự động hóa luồng tiếp nhận, phê duyệt chỉ đạo của Ban Giám đốc và quy trình 10 bước soạn thảo, kiểm tra thể thức, trình ký, ban hành văn bản đi.
- **Tối ưu hóa thời gian**: Luân chuyển công văn tức thì giữa Ban Giám đốc, Văn thư và các Khoa/Phòng chuyên môn.
- **Theo dõi tiến độ chặt chẽ**: Cảnh báo hạn xử lý, ghi nhận tiến độ giải quyết công việc và tiếp nhận file báo cáo kết quả từ các đơn vị thực hiện.
- **Bảo mật và an toàn dữ liệu**: Phân quyền chi tiết theo vai trò (RBAC), kiểm soát truy cập văn bản theo mức độ bảo mật (Public, Internal, Confidential), nhật ký kiểm toán (Audit Logs) minh bạch.

---

## 2. Các tính năng chính

### 2.1. Quản lý Văn bản đến (Incoming Documents)
- **Tiếp nhận & Vào sổ**: Văn thư tiếp nhận văn bản từ cơ quan ngoài, nhập số/ký hiệu, trích yếu, cơ quan ban hành, độ mật, độ khẩn và tải đính kèm file scan PDF.
- **Phê duyệt & Cho ý kiến chỉ đạo**: Ban Giám đốc tiếp nhận thông báo, xem trực tiếp PDF trên trình duyệt, nhập ý kiến chỉ đạo xử lý và phê duyệt (hoặc từ chối tiếp nhận).
- **Phân công xử lý**: Dựa trên chỉ đạo của Lãnh đạo, Văn thư hoặc Giám đốc giao đơn vị chủ trì và các khoa/phòng phối hợp.
- **Theo dõi & Lưu trữ**: Trưởng khoa/phòng nhận nhiệm vụ, phân bổ tiếp cho nhân viên, cập nhật tiến độ và đưa vào kho lưu trữ khi hoàn tất.

### 2.2. Quản lý Văn bản đi (Outgoing Workflow 10 bước)
Quy trình văn bản đi tuân thủ quy chuẩn quản lý văn thư nghiêm ngặt gồm 10 bước:
1. **Phân công soạn thảo (`PendingDraft`)**: Trưởng khoa/phòng giao việc soạn thảo cho nhân viên cụ thể.
2. **Soạn thảo dự thảo (`Draft`)**: Nhân viên biên tập nội dung, đính kèm file dự thảo (Word/PDF) và gửi duyệt.
3. **Lấy ý kiến phòng ban (`PendingDepartmentOpinion`)**: Gửi dự thảo lấy ý kiến đồng thuận từ các khoa/phòng liên quan trước khi ban hành; trưởng các đơn vị phản hồi Đồng ý hoặc Không đồng ý.
4. **Duyệt nội dung / Ký nháy (`UnitReviewed`)**: Trưởng khoa/phòng thẩm định nội dung chuyên môn, ký nháy xác nhận hoặc trả về yêu cầu sửa lại.
5. **Kiểm tra thể thức (`FormatChecked`)**: Văn thư kiểm tra quy cách văn bản (font chữ, lề, tiêu đề, số hiệu mẫu...) theo quy chuẩn hành chính.
6. **Trình ký (`WaitingForSign`)**: Văn thư in bản cứng đã chuẩn hóa để kẹp hồ sơ trình trực tiếp Ban Giám đốc.
7. **Ký duyệt văn bản (`Signed`)**: Giám đốc/Phó Giám đốc phê duyệt trên phần mềm và ký tay bản giấy.
8. **Vào sổ & Cấp số (`Issued`)**: Văn thư scan bản đã ký chính thức tải đè lên hệ thống, đồng thời cấp số hiệu chính thức (VD: `45/QĐ-BV`).
9. **Phát hành & Phân phối (`Sent`)**: Văn thư chuyển phát hành nội bộ đến các khoa/phòng hoặc gửi ra cơ quan bên ngoài.
10. **Lưu trữ điện tử (`Archived`)**: Văn bản chính thức được tự động chuyển vào kho lưu trữ lâu dài.

### 2.3. Quản lý Phân phối & Báo cáo kết quả
- **Phát hành đa kênh**: Hỗ trợ phát hành nội bộ (Internal) tới danh sách các khoa/phòng trong viện hoặc phát hành ra ngoài (External).
- **Theo dõi tiếp nhận**: Ghi nhận thời điểm các khoa/phòng xác nhận đã nhận văn bản.
- **Báo cáo tiến độ & nộp file kết quả**: Khoa/phòng được giao triển khai có thể cập nhật trạng thái thực hiện (`Sent` → `Received` → `InProgress` → `Completed`), đính kèm file báo cáo kết quả và tải xuống báo cáo phục vụ nghiệm thu.

### 2.4. Quản lý Nhiệm vụ & Phân công (Assignments)
- **Nhiệm vụ của tôi (My Tasks)**: Danh sách công việc được giao đích danh cho cá nhân.
- **Nhiệm vụ phòng ban (Department Tasks)**: Cho phép Trưởng khoa/phòng giám sát toàn bộ đầu việc của toàn đơn vị.
- **Công việc đã giao (Created by me)**: Theo dõi tiến độ các việc do bản thân tạo và giao cho người khác.
- **Bộ lọc thông minh**: Lọc nhanh theo trạng thái (`Chờ xử lý`, `Đang thực hiện`, `Hoàn thành`, `Quá hạn`).

### 2.5. Quản lý Cơ quan ban hành (Issuing Agencies)
- Danh mục các cơ quan, đơn vị bên ngoài (Bộ Y tế, Sở Y tế, BHXH, UBND, đối tác...).
- Hỗ trợ mã cơ quan, tên viết tắt, địa chỉ, trạng thái hoạt động giúp văn thư chọn nhanh khi tiếp nhận văn bản đến.

### 2.6. Kho lưu trữ điện tử (Archive)
- **Kho văn bản đến** và **Kho văn bản đi** tách biệt.
- Tối ưu tra cứu nhanh theo năm ban hành, số hiệu, loại văn bản, cơ quan phát hành hoặc từ khóa trích yếu mà không làm rối danh sách công việc đang xử lý.

### 2.7. Phân quyền động (RBAC & Dynamic Permissions)
- Quản trị vai trò linh hoạt: Hỗ trợ tạo mới và cấu hình vai trò động theo cơ cấu bệnh viện.
- Ma trận phân quyền chi tiết với hơn 35 quyền hạn phân loại theo nhóm:
  - `Documents`: View, Create, Edit, Delete, Assign, Upload, Approve, Reject, Archive.
  - `Outgoing`: Assign, Draft, Review, CheckFormat, Submit, Sign, Issue, Publish, Archive.
  - `Users`, `Departments`, `Roles`, `Permissions`, `IssuingAgencies`: View, Create, Edit, Delete.
  - `AuditLogs`, `Notifications`: View, Delete.

### 2.8. Thông báo thời gian thực (Real-time SignalR)
- Đẩy thông báo tức thời ngay trên giao diện web khi: có văn bản đến cần duyệt, có phân công mới, văn bản được ký duyệt, có ý kiến phản hồi hoặc nhiệm vụ sắp quá hạn.
- Trang **Quản lý thông báo** dành riêng cho Quản trị viên để giám sát toàn bộ lịch sử thông báo trong hệ thống.

### 2.9. Thùng rác & Phục hồi dữ liệu (Soft Delete)
- Áp dụng cơ chế xóa mềm (Soft Delete) cho tất cả các thực thể quan trọng: Văn bản, Người dùng, Phòng ban, Vai trò, Phân công, Cơ quan ban hành.
- Giao diện **Thùng rác (Trash)** cho phép tìm kiếm, phục hồi (`Restore`) dữ liệu hoặc xóa vĩnh viễn (`Permanent Delete` - chỉ dành cho Quản trị viên).

### 2.10. Nhật ký hệ thống & Kiểm toán (Audit Logs)
- Ghi nhận chi tiết mọi hành vi người dùng: thời gian thực hiện, loại hành động (đăng nhập, tạo, sửa, xóa, duyệt...), địa chỉ IP, User-Agent trình duyệt.
- Biểu đồ thống kê mức độ hoạt động của các tài khoản và phân hệ theo thời gian.

### 2.11. Hỗ trợ mạng nội bộ & Chạy Offline
- Thiết kế đặc thù cho môi trường mạng LAN bệnh viện không có Internet hoặc bị giới hạn băng thông.
- Tài nguyên tĩnh (Fonts, CSS, Logos, PDF Viewer) được bundle nội bộ, không phụ thuộc vào CDN bên ngoài.

---

## 3. Kiến trúc hệ thống & Công nghệ

### 3.1. Kiến trúc Clean Architecture (Backend)

Dự án áp dụng mô hình Clean Architecture 4 tầng chuẩn mực:

```
┌────────────────────────────────────────────────────────┐
│               QLVB.Api (Presentation)                  │
│       Controllers, Middlewares, SignalR Hub, Swagger   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              QLVB.Application (Use Cases)              │
│       Services, Interfaces, DTOs, Business Logic       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 QLVB.Domain (Core)                     │
│       Entities, Enums, Domain Exceptions, Constants    │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│            QLVB.Infrastructure (External Concerns)     │
│       EF Core, PostgreSQL, MinIO, JWT, Puppeteer, SMTP │
└────────────────────────────────────────────────────────┘
```

### 3.2. Bảng công nghệ sử dụng

| Phân hệ | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Backend Framework** | ASP.NET Core 9.0 | C# 13, RESTful API |
| **Database** | PostgreSQL 16 | Entity Framework Core 9, Code-First Migrations |
| **File Storage** | MinIO Object Storage | S3-compatible, lưu trữ tệp tin đính kèm an toàn |
| **Real-time** | SignalR Core | WebSocket thông báo thời gian thực |
| **Bảo mật** | JWT Bearer, BCrypt | Token authentication, băm mật khẩu bảo mật |
| **PDF Processing** | PuppeteerSharp, PdfPig | Kết xuất và xử lý tài liệu PDF |
| **Email Service** | MailKit / MimeKit | Gửi mã OTP khôi phục mật khẩu qua SMTP |
| **Frontend Framework** | React 18 + Vite | Giao diện Single Page Application (SPA) |
| **State Management** | Redux Toolkit | Quản lý trạng thái xác thực và dữ liệu toàn cục |
| **Styling & Icons** | Tailwind CSS, Lucide React | Giao diện hiện đại, tối ưu responsive đa kích thước màn hình |
| **Data Fetching** | Axios | Interceptors tự động đính kèm JWT Token |
| **Đa ngôn ngữ** | react-i18next | Hỗ trợ Tiếng Việt và Tiếng Anh |
| **Biểu đồ & UI** | Recharts, React Hot Toast | Thống kê dashboard và thông báo trực quan |
| **Containerization** | Docker & Docker Compose | Đóng gói toàn bộ ứng dụng và hạ tầng |
| **Web Server (Client)** | Nginx Alpine | Phục vụ tệp tĩnh Frontend trong môi trường Docker |

---

## 4. Bản đồ cổng dịch vụ (Port Mapping)

Hệ thống hoạt động với các cổng kết nối tiêu chuẩn sau:

| Dịch vụ | Container Name | Cổng truy cập | Mô tả & Đường dẫn |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | `qlvb-client` | **7081** (Docker) / `5173` (Dev) | Giao diện người dùng: `http://localhost:7081` |
| **Backend API** | `qlvb-api` | **5020** | Swagger API: `http://localhost:5020/swagger` |
| **PostgreSQL** | `qlvb-db` | **5432** | CSDL quan hệ chính (`qlvb_hospital`) |
| **MinIO Storage** | `qlvb-minio` | **9100** (API), **9101** (Console) | Quản trị lưu trữ file: `http://localhost:9101` |
| **pgAdmin 4** | `qlvb-pgadmin` | **5051** | Quản trị giao diện DB: `http://localhost:5051` |

---

## 5. Tài khoản mặc định

Sau khi khởi chạy và chạy migration/seed dữ liệu, hệ thống tự động khởi tạo các tài khoản mẫu đại diện cho các chức danh trong bệnh viện:

| Vai trò | Tên đăng nhập | Mật khẩu mặc định | Họ và tên | Khoa / Phòng |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Quản trị viên | Toàn viện |
| **Director** | `director1` | `Director@123` | Giám đốc Bệnh viện | Ban Giám đốc |
| **Manager** | `manager1` | `Manager@123` | Trưởng phòng Hành chính | Phòng Hành chính - Tổng hợp |
| **Clerk** | `clerk1` | `Clerk@123` | Văn thư Bệnh viện | Phòng Hành chính - Tổng hợp |
| **Staff** | `staff1` | `Staff@123` | Nhân viên Khoa Nội | Khoa Nội |
| **Staff** | `staff2` | `Staff@123` | Nhân viên Khoa Ngoại | Khoa Ngoại |

> [!NOTE]  
> Đối với môi trường đã khởi tạo từ phiên bản trước đó, nếu không đăng nhập được bằng `Admin@123`, vui lòng thử mật khẩu dự phòng là `123456`.  
> Khuyến cáo người dùng nên đổi mật khẩu ngay tại trang **Thông tin cá nhân** sau lần đầu đăng nhập.

---

## 6. Hướng dẫn cài đặt và khởi chạy

### Yêu cầu môi trường
- **Hệ điều hành**: Windows 10/11, Windows Server, Linux Ubuntu/Debian hoặc macOS.
- **Docker**: Docker Desktop hoặc Docker Engine + Docker Compose.
- **Bộ nhớ RAM khuyến nghị**: Tối thiểu 4GB RAM (khuyến nghị 8GB RAM).

---

### Phương án 1: Triển khai toàn bộ với Docker (Khuyến nghị cho Server)

Đây là phương pháp triển khai nhanh và chuẩn hóa nhất để đưa ứng dụng lên máy chủ hoặc chạy kiểm thử đầy đủ các dịch vụ.

#### Bước 1: Chuẩn bị mã nguồn và Publish Backend
Mở PowerShell / Terminal tại thư mục gốc của dự án `e-OfficeHospital_v1`:

```powershell
# Tạo bản build Release cho Backend ra thư mục ./publish
dotnet publish src/QLVB.Api/QLVB.Api.csproj -c Release -o ./publish
```

#### Bước 2: Khởi động toàn bộ cụm Container
Tại thư mục gốc dự án, thực hiện lệnh Docker Compose:

```bash
docker-compose build
docker-compose up -d
```

Hệ thống sẽ tự động khởi tạo và liên kết 5 dịch vụ: PostgreSQL, MinIO, ASP.NET Core API, Nginx Web Client và pgAdmin.

#### Bước 3: Truy cập hệ thống
- **Giao diện người dùng**: `http://localhost:7081`
- **Swagger API**: `http://localhost:5020/swagger`
- **MinIO Console**: `http://localhost:9101` (Tài khoản cấu hình qua biến `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` trong `.env`)
- **pgAdmin**: `http://localhost:5051` (Tài khoản cấu hình qua biến `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` trong `.env`)

#### Các lệnh quản lý Docker hữu ích:
```bash
# Xem trạng thái các container
docker-compose ps

# Xem nhật ký hoạt động (log) Backend
docker-compose logs -f api

# Xem log Frontend
docker-compose logs -f client

# Khởi động lại một dịch vụ
docker-compose restart api

# Dừng và giải phóng container (dữ liệu được giữ nguyên trong Docker Volumes)
docker-compose down
```

---

### Phương án 2: Chạy từng phần trong môi trường phát triển (Local Dev)

Dành cho lập trình viên cần chỉnh sửa mã nguồn và debug trực tiếp (hot-reload).

#### Bước 1: Khởi động cơ sở dữ liệu và Storage bằng Docker
Khởi động riêng PostgreSQL và MinIO:
```bash
docker-compose up -d db minio
```

#### Bước 2: Cấu hình và chạy Backend API (.NET 9)
1. Tạo file `.env` từ file mẫu `.env.example` (nếu chưa có) và điều chỉnh thông số môi trường của bạn:
   ```bash
   # Sao chép từ file mẫu cấu hình
   cp .env.example .env
   ```
   *(Toàn bộ chuỗi kết nối PostgreSQL, khóa JWT, MinIO Storage và Email SMTP đều được quản lý tập trung và an toàn trong `.env`)*
2. Thực hiện cập nhật Database (Migration) và Seeding:
   ```bash
   dotnet ef database update --project src/QLVB.Infrastructure --startup-project src/QLVB.Api
   ```
3. Khởi chạy Backend API:
   ```bash
   dotnet run --project src/QLVB.Api
   ```
   API sẽ hoạt động tại `http://localhost:5020` (Swagger: `http://localhost:5020/swagger`).

#### Bước 3: Cấu hình và chạy Frontend (React Vite)
1. Di chuyển vào thư mục `client_web`:
   ```bash
   cd client_web
   ```
2. Tạo hoặc kiểm tra file `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5020/api
   VITE_APP_NAME=Hospital E-Office System
   ```
3. Cài đặt thư viện và chạy:
   ```bash
   npm install
   npm run dev
   ```
   Frontend sẽ hoạt động tại `http://localhost:5173`.

---

### Cấu hình IP máy chủ cho mạng LAN Bệnh viện

Để các máy tính của bác sĩ, nhân viên trong mạng nội bộ bệnh viện có thể truy cập được:

1. **Xác định địa chỉ IP tĩnh của máy chủ** (Ví dụ: `192.168.1.100`).
2. **Cấu hình Frontend**:
   - Trước khi build Docker hoặc trước khi chạy client, cập nhật `client_web/.env`:
     ```env
     VITE_API_BASE_URL=http://192.168.1.100:5020/api
     ```
3. **Cấu hình Backend**:
   - Trong file `.env` tại thư mục gốc, cập nhật địa chỉ URL truy cập ứng dụng:
     ```env
     EmailSettings__AppBaseUrl=http://192.168.1.100:7081
     ```
4. **Mở cổng tường lửa (Firewall) trên máy chủ**:
   - Cho phép các kết nối Inbound tới cổng `7081` (Frontend) và cổng `5020` (API).
5. Nhân viên các khoa phòng truy cập qua trình duyệt: `http://192.168.1.100:7081`.

---

## 7. Cấu trúc thư mục dự án

```
e-OfficeHospital_v1/
├── src/                                  # Mã nguồn Backend (.NET 9 Clean Architecture)
│   ├── QLVB.Api/                         # Lớp Presentation
│   │   ├── Controllers/                  # 14 RESTful Controllers xử lý HTTP Requests
│   │   ├── Hubs/                         # SignalR Notification Hub
│   │   ├── Middlewares/                  # Exception Handling Middleware
│   │   ├── Dockerfile                    # Dockerfile runtime cho Backend API
│   │   ├── Program.cs                    # Điểm khởi chạy ứng dụng & DI Container
│   │   └── appsettings.json              # Khung mẫu cấu hình (dữ liệu biến môi trường tại .env)
│   ├── QLVB.Application/                 # Lớp Application (Use Cases & Business Logic)
│   │   ├── DTOs/                         # Data Transfer Objects cho từng chức năng
│   │   ├── Interfaces/                   # Hợp đồng Services & Repositories
│   │   └── Services/                     # Logic xử lý nghiệp vụ văn bản, workflow, auth
│   ├── QLVB.Domain/                      # Lớp Domain (Doanh nghiệp & Quy tắc cốt lõi)
│   │   ├── Constants/                    # Hằng số hệ thống & CustomPermissions
│   │   ├── Entities/                     # Thực thể CSDL (Document, User, Department...)
│   │   └── Enums/                        # Các enum quy trình, vai trò, trạng thái
│   └── QLVB.Infrastructure/              # Lớp Infrastructure (Triển khai công nghệ)
│       ├── Data/                         # ApplicationDbContext, DbInitializer (Seed data)
│       ├── Migrations/                   # Lịch sử EF Core Migrations
│       ├── Repositories/                 # Triển khai Repository Pattern & Unit of Work
│       ├── Security/                     # Xử lý JWT Token & Password Hasher
│       └── Services/                     # MinIO Storage, Puppeteer PDF, Email Service
│
├── client_web/                           # Mã nguồn Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── api/                          # Cấu hình Axios instance & API services
│   │   ├── components/                   # Các component tái sử dụng (Modal, Table, Form...)
│   │   ├── hooks/                        # Custom React Hooks
│   │   ├── layouts/                      # Layout chính (Sidebar, Header, AppLayout)
│   │   ├── locales/                      # Tệp từ điển đa ngôn ngữ (vi.json, en.json)
│   │   ├── pages/                        # 18 trang giao diện chức năng chính
│   │   ├── routes/                       # Cấu hình React Router & PrivateRoute
│   │   ├── store/                        # Redux Store & Redux Toolkit Slices
│   │   ├── utils/                        # Hàm tiện ích (Date formatting, Toast, Helpers)
│   │   ├── App.jsx                       # Component gốc
│   │   └── main.jsx                      # Entrypoint của React
│   ├── Dockerfile                        # Multi-stage Dockerfile cho Frontend (Node + Nginx)
│   ├── nginx.conf                        # Cấu hình Nginx reverse proxy & SPA routing
│   └── package.json                      # Danh sách dependencies Frontend
│
├── .env.example                          # File mẫu cấu hình biến môi trường
├── .env                                  # Cấu hình biến môi trường cục bộ (được bỏ qua bởi Git)
├── docker-compose.yml                    # Cấu hình khởi chạy cụm dịch vụ Docker
├── DEPLOYMENT.md                         # Hướng dẫn chi tiết triển khai máy chủ
├── docx.md                               # Hướng dẫn sử dụng nghiệp vụ chi tiết
└── README.md                             # Tài liệu tổng quan dự án (Tệp tin này)
```

---

## 8. Danh mục API Endpoints chính

### 8.1. Xác thực & Tài khoản (`/api/auth`)
- `POST /api/auth/login`: Đăng nhập, cấp phát JWT Bearer Token.
- `POST /api/auth/request-reset-code`: Gửi mã OTP xác nhận về email.
- `POST /api/auth/verify-reset-code`: Xác thực mã OTP khôi phục mật khẩu.
- `POST /api/auth/reset-password`: Đặt lại mật khẩu mới.
- `GET /api/auth/me`: Lấy thông tin tài khoản hiện hành.

### 8.2. Quản lý Văn bản đến (`/api/documents` & `/api/incoming-workflow`)
- `GET /api/documents`: Danh sách văn bản (hỗ trợ tìm kiếm, lọc theo loại, phân trang).
- `POST /api/documents`: Tải lên và vào sổ văn bản đến mới.
- `GET /api/documents/{id}`: Chi tiết văn bản đến.
- `PUT /api/documents/{id}`: Chỉnh sửa thông tin văn bản.
- `DELETE /api/documents/{id}`: Xóa văn bản (Soft delete).
- `GET /api/documents/{id}/preview`: Xem trước file PDF văn bản trực tiếp.
- `GET /api/documents/{id}/download`: Tải file đính kèm văn bản.
- `POST /api/documents/{id}/assign`: Giao xử lý văn bản cho các khoa/phòng.
- `POST /api/incoming-workflow/{id}/approve`: Ban Giám đốc phê duyệt và cho ý kiến chỉ đạo.
- `POST /api/incoming-workflow/{id}/reject`: Ban Giám đốc từ chối tiếp nhận văn bản đến.
- `POST /api/incoming-workflow/{id}/archive`: Chuyển văn bản đến vào kho lưu trữ.

### 8.3. Quy trình Văn bản đi (`/api/document-workflow`)
- `POST /api/document-workflow/assign`: Trưởng phòng giao nhiệm vụ soạn thảo văn bản đi.
- `POST /api/document-workflow/draft`: Nhân viên tạo dự thảo văn bản đi đính kèm file.
- `POST /api/document-workflow/{id}/request-opinions`: Gửi dự thảo lấy ý kiến các khoa/phòng liên quan.
- `POST /api/document-workflow/{id}/respond-opinion`: Trưởng khoa/phòng gửi phản hồi biểu quyết (Đồng ý / Không đồng ý).
- `GET /api/document-workflow/{id}/opinions`: Lấy danh sách ý kiến của các phòng ban.
- `POST /api/document-workflow/{id}/review-content`: Trưởng phòng duyệt nội dung / ký nháy bản thảo.
- `POST /api/document-workflow/{id}/reject-content`: Trưởng phòng từ chối duyệt nội dung bản thảo.
- `POST /api/document-workflow/{id}/sign`: Văn thư in trình ký, scan và tải file đã ký chính thức.
- `POST /api/document-workflow/{id}/reject-format`: Văn thư từ chối do không đạt chuẩn thể thức.
- `POST /api/document-workflow/{id}/issue`: Kiểm tra thể thức đạt chuẩn và cấp số hiệu chính thức.
- `POST /api/document-workflow/{id}/publish`: Phát hành văn bản đi.
- `POST /api/document-workflow/{id}/archive`: Đưa văn bản đi vào kho lưu trữ.
- `GET /api/document-workflow/{id}/history`: Xem toàn bộ dòng thời gian (Timeline) xử lý workflow.

### 8.4. Phân phối & Theo dõi thực hiện (`/api/document-distribution`)
- `POST /api/document-distribution/{documentId}/publish`: Phát hành văn bản nội bộ hoặc ra bên ngoài.
- `PUT /api/document-distribution/{distributionId}/confirm-external`: Xác nhận đối tác bên ngoài đã nhận.
- `PUT /api/document-distribution/{distributionId}/status`: Khoa/phòng cập nhật trạng thái xử lý nhiệm vụ.
- `POST /api/document-distribution/{distributionId}/report`: Tải lên file báo cáo kết quả thực hiện.
- `GET /api/document-distribution/{documentId}/list`: Lấy danh sách đơn vị nhận phát hành.
- `GET /api/document-distribution/{distributionId}/report/download`: Tải file báo cáo kết quả.

### 8.5. Cơ quan ban hành (`/api/issuingagencies`)
- `GET /api/issuingagencies`: Danh sách cơ quan ban hành bên ngoài.
- `GET /api/issuingagencies/{id}`: Xem chi tiết cơ quan ban hành.
- `POST /api/issuingagencies`: Tạo mới cơ quan ban hành.
- `PUT /api/issuingagencies/{id}`: Cập nhật thông tin cơ quan.
- `DELETE /api/issuingagencies/{id}`: Xóa cơ quan ban hành.

### 8.6. Phân công & Nhiệm vụ (`/api/assignments`)
- `GET /api/assignments`: Danh sách phân công công việc.
- `GET /api/assignments/my-department`: Phân công thuộc khoa/phòng hiện tại.
- `PUT /api/assignments/{id}/status`: Cập nhật tiến độ hoàn thành công việc.
- `DELETE /api/assignments/{id}`: Hủy phân công nhiệm vụ.

### 8.7. Quản trị Người dùng & Phòng ban (`/api/users` & `/api/departments`)
- `GET /api/users`: Danh sách nhân sự bệnh viện.
- `POST /api/users`: Tạo tài khoản người dùng mới.
- `PUT /api/users/{id}`: Cập nhật thông tin, gán vai trò và phòng ban.
- `DELETE /api/users/{id}`: Khóa/xóa tài khoản.
- `POST /api/users/{id}/change-password`: Quản trị viên đổi mật khẩu nhân viên.
- `PUT /api/users/me/profile`: Cập nhật thông tin cá nhân của người dùng hiện tại.
- `POST /api/users/me/change-password`: Đổi mật khẩu cá nhân.
- `GET /api/departments`: Danh sách các khoa/phòng trong bệnh viện.
- `POST /api/departments`: Thêm mới khoa/phòng.
- `PUT /api/departments/{id}`: Chỉnh sửa thông tin khoa/phòng.
- `DELETE /api/departments/{id}`: Xóa khoa/phòng.

### 8.8. Phân quyền & Vai trò (`/api/roles` & `/api/permissions`)
- `GET /api/roles`: Danh sách vai trò người dùng trong hệ thống.
- `POST /api/roles`: Tạo vai trò tùy biến mới.
- `PUT /api/roles/{id}`: Sửa tên/mô tả vai trò.
- `DELETE /api/roles/{id}`: Xóa vai trò (không áp dụng cho System Roles).
- `POST /api/roles/{id}/permissions`: Cập nhật ma trận quyền hạn cho vai trò.
- `GET /api/permissions`: Danh sách tất cả các quyền hạn hệ thống.

### 8.9. Thông báo thời gian thực (`/api/notifications`)
- `GET /api/notifications`: Toàn bộ thông báo hệ thống (Admin).
- `GET /api/notifications/my`: Danh sách thông báo gửi riêng cho người dùng đang đăng nhập.
- `PUT /api/notifications/{id}/read`: Đánh dấu thông báo đã đọc.
- `DELETE /api/notifications/{id}`: Xóa thông báo.

### 8.10. Thùng rác & Nhật ký kiểm toán (`/api/trash` & `/api/auditlogs`)
- `GET /api/trash/{type}`: Lấy danh sách đối tượng đã bị xóa (`documents`, `users`, `departments`, `roles`, `assignments`).
- `POST /api/trash/{type}/{id}/restore`: Phục hồi đối tượng từ thùng rác.
- `DELETE /api/trash/{type}/{id}/permanent`: Xóa vĩnh viễn khỏi cơ sở dữ liệu (Admin only).
- `GET /api/auditlogs`: Danh sách nhật ký thao tác và audit trail.
- `GET /api/auditlogs/statistics`: Thống kê tần suất hoạt động theo thời gian.

---

## 9. Tác giả & Thông tin liên hệ

- **Tác giả phát triển**: Mai Chí Vĩnh
- **Đơn vị công tác**: 
- **Email liên hệ**: [vinh092004@gmail.com](mailto:vinh092004@gmail.com) / [vinh23861@gmail.com](mailto:vinh23861@gmail.com)
- **Hỗ trợ kỹ thuật**: Vui lòng tạo issue trên kho lưu trữ hoặc gửi email trực tiếp cho tác giả để được hỗ trợ giải đáp kỹ thuật.

---

*Cập nhật lần cuối: 12/10/2026*