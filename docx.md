# TÀI LIỆU HƯỚNG DẪN CÀI ĐẶT, TRIỂN KHAI VÀ SỬ DỤNG HỆ THỐNG E-OFFICE HOSPITAL

**Phiên bản:** 1.0  
**Ngày cập nhật:** 22/05/2026  
**Dự án:** E-Office Hospital (Quản lý Văn bản điện tử Bệnh viện)

---

## MỤC LỤC

1. [PHẦN 1: GIỚI THIỆU TỔNG QUAN](#phần-1-giới-thiệu-tổng-quan)
2. [PHẦN 2: HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI (DÀNH CHO IT/DEVELOPER)](#phần-2-hướng-dẫn-cài-đặt-và-triển-khai-dành-cho-itdeveloper)
3. [PHẦN 3: HƯỚNG DẪN SỬ DỤNG DÀNH CHO NGƯỜI DÙNG](#phần-3-hướng-dẫn-sử-dụng-dành-cho-người-dùng)
4. [PHẦN 4: HƯỚNG DẪN QUẢN TRỊ HỆ THỐNG (DÀNH CHO ADMIN)](#phần-4-hướng-dẫn-quản-trị-hệ-thống-dành-cho-admin)

---

## PHẦN 1: GIỚI THIỆU TỔNG QUAN

### 1. Mục tiêu hệ thống
**E-Office Hospital** là hệ thống phần mềm quản lý văn bản, điều hành và tác nghiệp điện tử được thiết kế chuyên biệt cho môi trường Bệnh viện. Hệ thống giúp:
- **Số hóa toàn bộ quy trình** quản lý văn bản đến, văn bản đi, và công việc nội bộ.
- **Tối ưu hóa thời gian** luân chuyển giấy tờ, giảm thiểu thất lạc hồ sơ.
- **Theo dõi chặt chẽ tiến độ** xử lý công việc của từng phòng ban, cá nhân.
- **Quản trị phân quyền** rõ ràng theo cơ cấu tổ chức đặc thù của bệnh viện (Giám đốc, Trưởng/Phó khoa phòng, Văn thư, Nhân viên).

### 2. Kiến trúc tổng thể
Hệ thống được phát triển dựa trên mô hình Client-Server hiện đại:
- **Backend:** Xây dựng bằng `.NET 9.0` (C#) áp dụng mô hình Clean Architecture, Domain-Driven Design (DDD). Cung cấp các RESTful API.
- **Frontend:** Xây dựng bằng `ReactJS` và công cụ build `Vite`, giao diện hiện đại, thân thiện, tương thích nhiều thiết bị.
- **Cơ sở dữ liệu:** Hệ quản trị CSDL quan hệ `PostgreSQL`.
- **Lưu trữ tệp tin:** Sử dụng `MinIO` (S3 compatible) để lưu trữ các tài liệu đính kèm (PDF, Word, Excel, Hình ảnh) một cách an toàn và tối ưu độc lập với Database.

---

## PHẦN 2: HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI (DÀNH CHO IT/DEVELOPER)

Phần này hướng dẫn chi tiết cách thiết lập môi trường lập trình và đưa hệ thống vào hoạt động trên máy chủ hoặc máy cá nhân (Localhost).

### 1. Yêu cầu môi trường & Phần mềm
Trước khi bắt đầu cài đặt, đảm bảo máy tính/máy chủ của bạn đã cài đặt sẵn:
- **.NET 9.0 SDK**: Dùng để biên dịch và chạy khối Backend.
- **Node.js (>= 18.x) & npm**: Dùng để tải thư viện và chạy khối Frontend.
- **PostgreSQL (>= 14)**: Có thể cài trực tiếp trên máy hoặc dùng Docker.
- **Docker Desktop / Docker Engine**: Dùng để chạy MinIO Server.
- **Git** (Tuỳ chọn): Để lấy mã nguồn từ kho lưu trữ.
- **Trình soạn thảo mã**: Visual Studio 2022, Visual Studio Code hoặc Rider.

### 2. Hướng dẫn Chạy trên Local (Môi trường Lập trình/Dev)

**Bước 1: Khởi tạo Database và MinIO (Dùng Docker)**
Mở Terminal tại thư mục gốc của dự án `e-OfficeHospital_v1` (nơi có file `docker-compose.yml`) và chạy:
```bash
docker-compose up -d
```
- **MinIO Console:** Truy cập `http://localhost:9101` (Tài khoản cấu hình trong file `.env`).
*(Lưu ý: Tạo sẵn một bucket tên `eoffice-bucket` trên MinIO và set Access Policy là `Public` hoặc `Read/Write`).*

**Bước 2: Cấu hình và Chạy Backend (.NET Core)**
1. Mở file `.env` (tạo từ `.env.example`), kiểm tra và điều chỉnh các biến kết nối (PostgreSQL, MinIO...) cho đúng với Local.
2. Mở Terminal tại thư mục `src/QLVB.Api` và chạy lệnh cập nhật CSDL:
   ```bash
   dotnet ef database update --project ../QLVB.Infrastructure
   ```
3. Khởi chạy Backend API:
   ```bash
   dotnet run
   ```
   *API sẽ chạy tại cổng 5020: `http://localhost:5020/swagger`.*

**Bước 3: Cấu hình và Chạy Frontend (ReactJS)**
1. Tại thư mục `client_web`, tạo file `.env` (có thể copy từ `.env.example`) và trỏ API về máy:
   ```env
   VITE_API_BASE_URL=http://localhost:5020/api
   ```
2. Cài đặt thư viện và chạy:
   ```bash
   npm install
   npm run dev
   ```
   *Frontend sẽ chạy tại: `http://localhost:5173`.*

### 3. Hướng dẫn Đưa Project lên Server Nội bộ (Deploy bằng Docker)

Việc triển khai lên môi trường nội bộ thực tế (Production) đòi hỏi cấu hình IP tĩnh và sử dụng Docker để đóng gói toàn bộ hệ thống (Frontend + Backend + DB + Storage).

**Bước 1: Cấu hình IP tĩnh của Server**
Giả sử Server của bạn có IP mạng nội bộ là `192.168.1.100`.
- **Frontend:** Sửa file `.env` (hoặc `.env.production`) trong `client_web/`:
  ```env
  VITE_API_BASE_URL=http://192.168.1.100:5020/api
  ```
- **Backend:** Mở file `.env` tại thư mục gốc và cập nhật `EmailSettings__AppBaseUrl` theo IP của Server thực tế.

**Bước 2: Đóng gói Backend (Publish)**
Để tối ưu thời gian build Docker image trên Server, ta nên publish Backend ra thư mục trung gian.
Tại thư mục gốc dự án, chạy lệnh:
```bash
dotnet publish src/QLVB.Api/QLVB.Api.csproj -c Release -o ./publish
```

**Bước 3: Build Image và Khởi chạy toàn bộ hệ thống**
1. Copy toàn bộ mã nguồn (đã bao gồm thư mục `publish` và `client_web` đã cấu hình IP) lên Server nội bộ.
2. Tại thư mục gốc trên Server (nơi có chứa `docker-compose.yml`), chạy lệnh để build và khởi động:
   ```bash
   docker-compose build
   docker-compose up -d
   ```
Lệnh này sẽ tự động tải các base image (.NET Runtime, Node/Nginx), build source và chạy ngầm toàn bộ dịch vụ.

**Bước 4: Cấu hình Tường lửa (Firewall) và Các Port cần mở**
Hệ thống cần mở các Port sau trên Firewall của Server nội bộ để người dùng trong mạng LAN có thể truy cập:
- **Port 7081 (hoặc 80/443 nếu dùng Reverse Proxy):** Dùng để truy cập Giao diện phần mềm (Frontend). Ví dụ: `http://192.168.1.100:7081`.
- **Port 5020:** Dùng để Frontend gọi API Backend hoặc xem Swagger. Ví dụ: `http://192.168.1.100:5020`.
- **Port 9101 (MinIO Console):** Dùng để truy cập giao diện quản trị Storage.

*(Hệ thống sử dụng Docker Volumes cho DB và MinIO nên dữ liệu sẽ được lưu trữ an toàn ngay cả khi bạn khởi động lại container).*

---

## PHẦN 3: HƯỚNG DẪN SỬ DỤNG DÀNH CHO NGƯỜI DÙNG

Phần này hướng dẫn các thao tác nghiệp vụ hàng ngày trên phần mềm dành cho các cán bộ, nhân viên y tế và lãnh đạo bệnh viện.

### 1. Đăng nhập và Làm quen giao diện
- **Truy cập:** Mở trình duyệt web (Chrome/Edge/Firefox) và truy cập đường dẫn được nội bộ cung cấp (Ví dụ: `http://localhost:5173`).
- **Tài khoản mặc định (Test):**
  - Quản trị viên (Admin): `admin` / `123456`
  - Giám đốc (Director): `director1` / `123456`
  - Trưởng khoa/Phòng (Manager): `manager1` / `123456`
  - Văn thư (Clerk): `clerk1` / `123456`
  - Nhân viên/Bác sĩ (Staff): `staff1` / `123456`
*(Sau khi đăng nhập thành công, hệ thống khuyến cáo người dùng nên đổi mật khẩu tại trang Thông tin cá nhân).*

**Bố cục giao diện chính:**
- **Menu điều hướng (Sidebar):** Cạnh trái màn hình, chứa các chức năng (Dashboard, Văn bản đến, Văn bản đi, Phân công, Quản lý...).
- **Khu vực hiển thị (Main Content):** Hiển thị danh sách dữ liệu và biểu mẫu.
- **Thanh công cụ trên (Header):** Nút thông báo, tùy chọn tài khoản cá nhân.

### 2. Quy trình Quản lý Văn bản đến
*(Quy trình tiếp nhận tài liệu, công văn từ các cơ quan ngoài gửi đến Bệnh viện).*

**Bước 1: Tiếp nhận và Vào sổ (Dành cho Văn thư)**
1. Chọn menu **Văn bản đến** > Bấm nút **Thêm mới / Tải văn bản**.
2. Nhập các thông tin trích yếu: Số/Ký hiệu, Ngày ban hành, Cơ quan ban hành, Loại văn bản, Độ khẩn/Độ mật.
3. Đính kèm bản Scan (File PDF) của văn bản.
4. Bấm **Lưu** (Văn bản sẽ được chuyển vào trạng thái "Chờ Ban Giám đốc duyệt").

**Bước 2: Phê duyệt và Chỉ đạo xử lý (Dành cho Ban Giám đốc)**
1. Giám đốc nhận được thông báo có văn bản đến chờ duyệt.
2. Giám đốc xem chi tiết nội dung văn bản và bản Scan đính kèm.
3. Giám đốc nhập **Ý kiến chỉ đạo** xử lý (Ví dụ: "Giao Phòng Kế hoạch tổng hợp khẩn trương rà soát và báo cáo").
4. Bấm **Duyệt** (hoặc **Từ chối**). Văn bản được duyệt sẽ chuyển sang trạng thái cho phép phân công.

**Bước 3: Phân công xử lý (Dành cho Giám đốc hoặc Văn thư)**
1. Dựa trên ý kiến chỉ đạo, tiến hành click chọn **Giao xử lý / Phân công** tại văn bản đã duyệt.
2. Chọn **Khoa/Phòng ban xử lý chính** và các phòng ban phối hợp (nếu có).
3. Hệ thống sẽ tự động gửi thông báo (Notification) đến Trưởng của các phòng ban được giao nhiệm vụ.

**Bước 4: Tiếp nhận và Xử lý cấp Phòng ban (Dành cho Trưởng phòng/Trưởng khoa)**
1. Trưởng khoa nhận được thông báo, vào menu **Phân công**.
2. Xem nội dung văn bản và ý kiến chỉ đạo của Ban Giám đốc. Từ đầu việc chung của Khoa, Trưởng khoa có thể tiếp tục chia nhỏ nhiệm vụ, giao đích danh cho **Nhân viên / Bác sĩ** cấp dưới thực hiện.

**Bước 5: Báo cáo kết quả xử lý (Dành cho Người được giao việc)**
1. Khi hoàn thành công việc, người dùng vào chi tiết công việc, chọn **Cập nhật tiến độ** hoặc **Báo cáo hoàn thành**.
2. Có thể đính kèm file kết quả. Trạng thái công việc chuyển sang "Đã hoàn thành". Trưởng khoa và Ban Giám đốc có thể theo dõi tiến độ xử lý của từng phòng ban.

### 3. Quy trình Quản lý Văn bản đi (Chuẩn 10 Bước)
*(Quy trình soạn thảo, phê duyệt và ban hành công văn, quyết định từ phía Bệnh viện gửi ra ngoài hoặc lưu hành nội bộ).*

Quy trình văn bản đi trên hệ thống tuân thủ nghiêm ngặt các bước (workflow) sau:

- **Bước 1: Phân công soạn thảo (Pending Draft)**
  - Trưởng khoa/Phòng tiếp nhận yêu cầu, tiến hành phân công cho một nhân viên cụ thể trong phòng chịu trách nhiệm soạn thảo văn bản.
- **Bước 2: Soạn thảo (Drafting)**
  - Nhân viên được phân công tiến hành soạn thảo, điền thông tin dự thảo và đính kèm file (Word, PDF) rồi gửi trình duyệt.
- **Bước 3: Lấy ý kiến phòng ban (Department Opinion)**
  - Đối với các văn bản quan trọng liên quan đến nhiều đơn vị, hệ thống cho phép "Gửi lấy ý kiến". Các phòng ban liên quan sẽ vào hệ thống để "Đồng ý" hoặc "Từ chối" (yêu cầu đa số đồng ý để văn bản được đi tiếp).
- **Bước 4: Duyệt nội dung (Unit Review)**
  - Trưởng khoa/Phòng đọc lại bản thảo (sau khi tổng hợp ý kiến nếu có). Nếu đạt, bấm "Duyệt" để chuyển tiếp. Nếu chưa đạt, bấm "Từ chối" để nhân viên làm lại.
- **Bước 5: Kiểm tra Thể thức (Clerk Formatting Check)**
  - Văn thư bệnh viện sẽ rà soát các lỗi chính tả, căn lề, format chuẩn. Nếu đạt, chuyển sang trình ký.
- **Bước 6: Trình ký (Submission)**
  - Hệ thống ghi nhận trạng thái chờ ký. Văn thư tiến hành in bản cứng của dự thảo (đã đạt chuẩn thể thức) để kẹp hồ sơ trình trực tiếp lên Ban Giám đốc.
- **Bước 7: Ký duyệt (Approval & Signing)**
  - Giám đốc / Phó Giám đốc xem xét nội dung, phê duyệt trên hệ thống và tiến hành ký tay trực tiếp lên bản cứng bằng giấy.
- **Bước 8: Vào sổ - Cấp số (Numbering)**
  - Sau khi có bản cứng đã ký tay, Văn thư tiến hành scan thành file PDF, tải (upload) đè lên hệ thống để thay thế bản nháp. Đồng thời cấp Số hiệu chính thức cho văn bản (VD: `45/QĐ-BV`).
- **Bước 9: Phát hành (Publishing)**
  - Văn bản chính thức có hiệu lực, được gửi đến các khoa/phòng liên quan qua hệ thống.
- **Bước 10: Lưu trữ (Archiving)**
  - Bản gốc được tự động đưa vào Kho lưu trữ hệ thống, dễ dàng tìm kiếm tra cứu sau này.

### 4. Quản lý Nhiệm vụ và Phân công (Assignments)
Menu **Phân công (Assignments)** là nơi theo dõi toàn bộ đầu việc của cá nhân và phòng ban.
- **Nhiệm vụ của tôi (My Tasks):** Các việc được giao đích danh cho cá nhân bạn.
- **Nhiệm vụ Phòng ban (Department Tasks):** Nếu bạn là Trưởng/Phó khoa, bạn sẽ thấy tổng hợp các việc của cả khoa mình.
- **Đã giao (Created by me):** Các công việc do bạn tạo và giao cho người khác.
*Lưu ý: Tại đây hỗ trợ lọc theo Trạng thái (Chờ xử lý, Đang thực hiện, Hoàn thành, Quá hạn).*

### 5. Thống kê và Bảng điều khiển (Dashboard)
Ngay khi đăng nhập, màn hình Dashboard cung cấp các thẻ báo cáo nhanh:
- Thống kê tổng số Văn bản Đến / Đi trong tháng.
- Số lượng công việc sắp đến hạn hoặc đã quá hạn (thể hiện bằng màu đỏ cảnh báo).
- Biểu đồ phân bổ văn bản theo các loại văn bản, giúp Lãnh đạo nắm bắt tình hình hoạt động hành chính của Bệnh viện.

### 6. Kho lưu trữ Văn bản (Archive)
- **Lưu trữ Văn bản đến & Văn bản đi:** Sau khi hoàn thành các quy trình xử lý, văn bản sẽ được chuyển vào khu vực **Kho lưu trữ**.
- Tại đây, người dùng có thể dễ dàng tra cứu, tìm kiếm lại các văn bản cũ theo năm, theo loại văn bản, cơ quan ban hành hoặc từ khóa. Đảm bảo dữ liệu không bị trộn lẫn với các văn bản đang cần xử lý hiện tại.

### 7. Thông tin cá nhân và Xác thực (Profile)
- Quản lý thông tin tài khoản cá nhân, xem chi tiết chức vụ và phòng ban hiện tại.
- Cho phép người dùng thay đổi mật khẩu định kỳ để đảm bảo an toàn thông tin cá nhân.
- Hỗ trợ tính năng xác thực Email (Verify Email) để khôi phục mật khẩu khi cần thiết.
- Tùy chỉnh nhận thông báo hệ thống trên trình duyệt.

---

## PHẦN 4: HƯỚNG DẪN QUẢN TRỊ HỆ THỐNG (DÀNH CHO ADMIN)

Menu **Quản trị hệ thống** chỉ hiển thị với những tài khoản có vai trò `Admin`. Đây là khu vực thiết lập dữ liệu nền tảng cho hệ thống.

### 1. Quản lý Cơ cấu tổ chức (Khoa / Phòng / Ban)
- **Truy cập:** Menu Quản trị > **Phòng ban / Đơn vị**.
- **Tính năng:** Thêm, Sửa tên, Xóa các Khoa/Phòng ban trong bệnh viện. Thiết lập phân cấp (nếu có). Tất cả user trong hệ thống đều phải thuộc một phòng ban nào đó.

### 2. Quản lý Người dùng & Chức danh
- **Truy cập:** Menu Quản trị > **Người dùng (Users)**.
- **Tính năng:**
  - **Tạo mới tài khoản:** Nhập Email, Tên đầy đủ, Mật khẩu khởi tạo. Cán bộ nhân viên không tự đăng ký tài khoản mà phải do Admin cấp.
  - **Gán phòng ban và Chức vụ:** Chọn user thuộc Khoa nào, giữ chức vụ gì (Trưởng khoa, Nhân viên...).
  - **Gán Vai trò (Role):** Đây là bước quan trọng nhất. Một User cần có Role (VD: `Admin`, `Director`, `Manager`, `Clerk`, `Staff`) để hệ thống biết họ được quyền làm gì.
  - **Reset Mật khẩu / Khóa tài khoản:** Khi nhân viên quên mật khẩu hoặc nghỉ việc.

### 3. Phân quyền Hệ thống (Roles & Permissions)
- Hệ thống hỗ trợ phân quyền động tới từng ngóc ngách chức năng.
- **Menu Vai trò (Roles):** Cho phép tạo các Role mới (VD: "Phó giám đốc phụ trách Nội").
- **Phân quyền (Permissions):** Gán các quyền (Xem văn bản, Sửa văn bản, Xóa văn bản, Duyệt văn bản...) cho từng Role cụ thể.

### 4. Quản lý Danh mục dùng chung
- **Danh mục Loại văn bản:** Báo cáo, Quyết định, Chỉ thị, Thông báo, Tờ trình...
- **Cơ quan ban hành (Issuing Agencies):** Quản lý danh sách các tổ chức, cơ quan bên ngoài thường xuyên gửi văn bản đến (Ví dụ: Bộ Y tế, Sở Y tế, Bảo hiểm Xã hội...). Giúp tự động gợi ý khi Văn thư nhập liệu.
- **Danh mục Sổ văn bản:** Tạo các sổ năm (Sổ công văn đến 2026, Sổ công văn đi 2026...) để quản lý đánh số thứ tự tự động.

### 5. Quản lý Thông báo (Notification Management)
- Hệ thống có chức năng đẩy thông báo (Real-time) tới người dùng khi có sự kiện (Có văn bản mới cần duyệt, Có nhiệm vụ được phân công, Công việc quá hạn...).
- Admin có thể quản trị xem toàn bộ lịch sử thông báo đã gửi, gửi cho ai, nội dung là gì và trạng thái người dùng đã đọc hay chưa.

### 6. Thùng rác và Phục hồi dữ liệu (Trash)
- Hệ thống áp dụng cơ chế **Soft Delete** (Xóa mềm) để tránh mất mát dữ liệu do thao tác nhầm lẫn. 
- Khi người dùng xóa văn bản hay danh mục, dữ liệu sẽ được chuyển vào **Thùng rác**.
- Admin có quyền truy cập Thùng rác để:
  - **Khôi phục (Restore):** Đưa dữ liệu trở về trạng thái hoạt động ban đầu.
  - **Xóa vĩnh viễn (Hard Delete):** Xóa hoàn toàn dữ liệu khỏi Database để giải phóng dung lượng (áp dụng khi đã kiểm tra kỹ).

### 7. Theo dõi Nhật ký Hoạt động (Audit Logs)
- Ghi nhận chi tiết mọi tương tác của người dùng trên hệ thống: Đăng nhập lúc nào, tạo văn bản nào, xóa dữ liệu gì, thay đổi quyền hạn ra sao.
- Phục vụ công tác thanh tra, rà soát an ninh thông tin, chống thất thoát và phá hoại dữ liệu. Đảm bảo tính minh bạch tuyệt đối trong quy trình số.
