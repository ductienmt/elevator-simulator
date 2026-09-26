# Elevator Simulator

Mô phỏng hệ thống thang máy cho tòa nhà 10 tầng, có 3 thang máy (A, B, C) hoạt động song song. Backend viết bằng NestJS + TypeScript, điều phối thang bằng cost-based scheduler, di chuyển theo thuật toán LOOK/SCAN, đẩy dữ liệu real-time qua Socket.IO + REST API.

## 1. Kiến trúc

```text
                      Client
                         │
             REST API + Socket.IO Gateway
                         │
                         ↓
               Elevator Controller
                         │
                         ↓
               Central Scheduler
                         │
              (Cost-based Strategy)
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   Elevator A       Elevator B       Elevator C
        │                │                │
   Queue (Requests) Queue (Requests) Queue (Requests)
        │                │                │
   Door & Timers    Door & Timers    Door & Timers
        │                │                │
   Passengers       Passengers       Passengers
```

Nguyên tắc phân quyền mình giữ xuyên suốt project:

1. **Central Scheduler** chỉ làm đúng một việc: nhận `HallRequest` và tính xem thang nào nên nhận request đó, dựa trên cost.
2. **Elevator** tự quản lý toàn bộ phần còn lại — queue của chính nó, di chuyển (`move()`), state, cửa, và tự hoàn thành request.
3. Nguyên tắc cứng: Scheduler hay Controller **không bao giờ được** can thiệp vào từng bước di chuyển của thang. Việc đó thuộc về elevator tự quyết.

## 2. OOP & Clean Architecture

**Encapsulation** — toàn bộ state của `Elevator` (`currentFloor`, `direction`, `state`, `door`, `passengers`) đều `private`. Muốn thay đổi gì phải đi qua method: `openDoor()`, `closeDoor()`, `keepDoorOpen()`, `boardPassenger()`, `tick()`, `move()`.

**Inheritance** — class trừu tượng `Request` làm gốc, tách thành:
- `HallRequest`: có `floor`, `direction` (UP/DOWN), `assignedElevatorId`
- `DestinationRequest`: chỉ có `elevatorId`, `destinationFloor`, không có direction

**Polymorphism / Abstraction** — interface `ElevatorScheduler` định nghĩa hợp đồng điều phối:

```typescript
export interface ElevatorScheduler {
  selectElevator(elevators: Elevator[], request: HallRequest): Elevator | null;
}
```

`CostBasedScheduler` implement interface này. Nhờ vậy có thể swap sang thuật toán khác mà không đụng gì tới controller.

## 3. Hall Request vs Destination Request

| Tiêu chí | HallRequest | DestinationRequest |
|---|---|---|
| Tạo ở đâu | Ngoài sảnh (bấm nút UP/DOWN) | Trong cabin |
| Direction | Bắt buộc | Không có |
| Ai xử lý | Central Scheduler chọn thang | Elevator đang chở khách tự xử lý |
| Mục đích | Đón khách trên đường đi | Đưa khách tới tầng cần đến |

### Vòng đời hành khách

```text
Khách đứng ở tầng X
       ↓
Bấm nút gọi thang UP/DOWN
       ↓
Tạo HallRequest (PENDING)
       ↓
Scheduler gán cho 1 thang (ASSIGNED)
       ↓
Thang di chuyển tới tầng X
       ↓
Dừng lại (STOPPED), mở cửa (DOOR_OPEN)
       ↓
Khách bước vào (BOARDING)
       ↓
Khách chọn tầng đích → tạo DestinationRequest
       ↓
Khách vào cabin (INSIDE), HallRequest chuyển PICKED_UP
       ↓
Cửa đóng (tự động sau vài giây hoặc bấm nút)
       ↓
Thang chạy tới tầng đích
       ↓
Dừng, mở cửa
       ↓
Khách rời thang (COMPLETED)
       ↓
DestinationRequest chuyển COMPLETED
```

Điều kiện để khách được coi là `BOARDING`: thang đang `STOPPED`, đúng tầng khách đứng, cửa đang `OPEN`, và request đã được gán cho đúng thang này.

## 4. Cost-Based Scheduler

Mỗi khi có hall request mới, scheduler tính điểm cho từng thang:

```
cost = distanceCost + queuePenalty + reversePenalty
```

- `distanceCost` = khoảng cách tuyệt đối giữa tầng hiện tại của thang và tầng request
- `queuePenalty` = số request đang chờ trong queue × 2
- `reversePenalty`:
  - Thang đang IDLE: 0
  - Cùng hướng, chưa đi qua tầng đó: 0
  - Cùng hướng nhưng đã đi qua tầng đó: 10
  - Ngược hướng: 10

Thang nào cost thấp nhất thì được chọn.

## 5. Thuật toán di chuyển LOOK/SCAN

Khi thang đang đi **UP**:

1. Ưu tiên destination request phía trên trước.
2. Rồi tới hall request UP phía trên (dừng đón khách).
3. **Không dừng** cho hall request DOWN dù ở phía trên — request đó vẫn nằm chờ, đợi thang lên tới đỉnh rồi quay đầu mới phục vụ.
4. Hết việc phía trên thì đổi chiều xuống DOWN, xử lý tiếp các tầng phía dưới theo thứ tự giảm dần.

**Xử lý đích ngược chiều**: thang từ tầng 10 đi xuống 1, tại tầng 3 đón khách muốn lên tầng 4. Thang không chèn ngang lên 4 ngay — mà đi hết xuống 2, 1 trước, rồi mới đổi chiều lên 4 trả khách.

## 6. Quản lý cửa

- `DoorState`: `OPEN`, `CLOSED`.
- Hai luật bất biến:
  1. Thang không được di chuyển khi cửa đang mở.
  2. Cửa không được mở khi thang đang di chuyển (bắn `409 ConflictException`).
- **Auto-close**: cửa mở thì có timer đếm ngược 3000ms, hết giờ tự đóng.
- **Keep door open**: `door.keepOpen()` hủy timer hiện tại, giữ cửa mở tới khi có lệnh đóng.
- **Close ngay**: `door.close()` hủy timer và đóng cửa tức thì (0ms), thang chạy tiếp được ở tick kế tiếp.

## 7. Test case đã cover

1. Thang đi UP, request UP phía trên → dừng đón bình thường.
2. Thang đi UP, request DOWN phía trên → đi thẳng qua, không dừng, xử lý sau khi đổi chiều.
3. Thang đi DOWN, request DOWN phía dưới → dừng đón.
4. Khách chọn tầng ngược chiều đang đi → thang xử lý xong lượt hiện tại rồi mới đổi chiều.
5. Nhận nhiều tầng lúc đi UP (7, 3, 5) → dừng tăng dần 3 → 5 → 7.
6. Tương tự với DOWN (3, 7, 5) → dừng giảm dần 7 → 5 → 3.
7. Scheduler chọn đúng thang cost thấp nhất giữa A/B/C.
8. Cửa đang mở thì `move()` bị chặn tuyệt đối.
9. Kịch bản 10→1, đón tại tầng 3 muốn lên 4 → xử lý xong 1, rồi mới quay lên 4.
10. Mở cửa khi đang di chuyển → bắn lỗi 409.
11. Thao tác cửa: mở → keep open → đóng ngay.
12. Vòng đời khách đầy đủ: WAITING → BOARDING → INSIDE → ARRIVING → COMPLETED.
13. Nhiều khách cùng lúc trong 1 cabin, mỗi người xuống đúng tầng.

## 8. Trade-off

- **In-memory state thay vì DB**: chọn vì mục tiêu là mô phỏng real-time, latency thấp (<1ms). Nếu làm production thật thì sẽ cân nhắc Redis Streams hoặc Event Sourcing để recover được khi crash.
- **Tick loop kết hợp Event-driven**: chuyển động chạy theo tick (1000ms) để dễ dự đoán và test, thao tác cửa thì phản hồi ngay theo event giữ được tính predictable mà vẫn phản hồi nhanh với user.