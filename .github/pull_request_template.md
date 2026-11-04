## Slice
- [ ] FE-A Shell & Filter (@nguyenanhlong)
- [ ] FE-B Revenue
- [ ] FE-C Orders & Buyers

## Việc đã làm
<!-- 2-4 dòng, đủ để người review hiểu phạm vi -->

## Checklist bắt buộc
- [ ] Không sửa file ngoài scope của mình (đối chiếu `.github/CODEOWNERS`)
- [ ] Không đổi tên field / signature trong `src/contracts/**`
- [ ] Không import chéo `src/features/*` (CI boundaries xanh)
- [ ] Không import fixture/mock trong component
- [ ] PR ≤ 400 dòng diff (không tính fixture và test)
- [ ] Đã test tay `loading.tsx` và `error.tsx` của slot mình
- [ ] Đã chụp màn hình 3 state: loading / empty / error
- [ ] `npm run verify` xanh ở máy local

## Contract impact
- Field thêm mới:
- Field/signature thay đổi: **không** ✔
- Cần BE xác nhận:

## Cách test
<!-- các bước để người review tự chạy lại -->
