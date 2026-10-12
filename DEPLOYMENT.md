# Hướng dẫn Triển khai và Cập nhật Hệ thống (Server)

Tài liệu này cung cấp hướng dẫn đầy đủ để bạn có thể tự chỉnh sửa mã nguồn, build lại và triển khai hệ thống E-Office Hospital lên server bằng Docker.

---

## 1. Quy trình Chỉnh sửa và Cập nhật (Workflow)

Khi bạn muốn thay đổi code và đưa lên server, hãy thực hiện theo các bước sau:

### Bước 1: Chỉnh sửa mã nguồn
- Sửa lỗi hoặc thêm tính năng trong các thư mục `src/` (Backend) hoặc `client_web/` (Frontend).

### Bước 2: Cập nhật Database (Nếu có thay đổi Entity)
Nếu bạn thay đổi cấu trúc bảng trong Backend, bạn cần tạo Migration:
1. Mở Terminal tại thư mục gốc của dự án.
2. Tạo file migration mới (thay `Ten_Migration` bằng tên mô tả thay đổi):
   ```powershell
   dotnet ef migrations add Ten_Migration --project src/QLVB.Infrastructure --startup-project src/QLVB.Api
   ```
3. Cập nhật vào Database cục bộ để kiểm tra:
   ```powershell
   dotnet ef database update --project src/QLVB.Infrastructure --startup-project src/QLVB.Api
   ```

### Bước 3: Build Backend (Chiến lược Local Publish)
Để tối ưu thời gian build Docker, chúng ta build Backend ra thư mục `publish` trước:
1. Xóa thư mục `publish` cũ (nếu có).
2. Chạy lệnh build Release:2
   ```powershell
   dotnet publish src/QLVB.Api/QLVB.Api.csproj -c Release -o ./publish
   ```

### Bước 4: Build và Khởi động Docker
Sau khi đã có thư mục `publish` mới, chạy các lệnh Docker Compose:
1. Build lại Image (chỉ build phần thay đổi):
   ```bash
   docker-compose build
   ```
2. Khởi động lại các container:
   ```bash
   docker-compose up -d
   ```

---

## 2. Cấu hình IP Server cho mạng nội bộ

Để các máy tính khác trong mạng có thể truy cập, bạn cần cấu hình IP tĩnh của Server:

1. **Backend**: Mở file `.env` tại thư mục gốc và cập nhật `EmailSettings__AppBaseUrl`:
   ```env
   EmailSettings__AppBaseUrl=http://192.168.x.x:7081
   ```
2. **Frontend**: Cập nhật file `.env` trong thư mục `client_web/` (trước khi build):
   ```env
   VITE_API_BASE_URL=http://192.168.x.x:5020/api
   ```

---

## 3. Các lệnh quản lý hữu ích

| Thao tác | Lệnh thực hiện |
| :--- | :--- |
| **Xem trạng thái các container** | `docker-compose ps` |
| **Xem log Backend (để debug)** | `docker-compose logs -f api` |
| **Xem log Frontend** | `docker-compose logs -f client` |
| **Dừng toàn bộ hệ thống** | `docker-compose down` |
| **Xóa bỏ các Image cũ không dùng** | `docker image prune -f` |
| **Khởi động lại một dịch vụ (VD: API)** | `docker-compose restart api` |

---

## 4. Cấu trúc cổng (Ports) mặc định

- **Frontend (Giao diện)**: `7081` -> Truy cập qua `http://[IP_SERVER]:7081`
- **Backend (API/Swagger)**: `5020` -> Truy cập qua `http://[IP_SERVER]:5020/swagger`
- **Database (PostgreSQL)**: `5432`
- **Storage (MinIO Console)**: `9101` (Tài khoản cấu hình qua biến `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` trong `.env`)

---

## 5. Lưu ý quan trọng
- **Dữ liệu**: Dữ liệu được lưu trong Docker Volumes nên khi chạy `docker-compose down` và `up` lại sẽ **không bị mất dữ liệu**.
- **Migration**: Khi chạy trên Server, hệ thống sẽ tự động chạy `database update` nếu bạn đã tạo migration trước đó trong code.
- **Port**: Đảm bảo Firewall trên Server đã mở các port `7081` và `5020`.
