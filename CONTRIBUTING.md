# Quy trình làm việc

## 1. Nhánh

| Nhánh | Từ | Merge vào |
|---|---|---|
| `main` | — | — (chỉ nhận PR) |
| `feat/fe-a-shell` | `main` | `main` qua PR |
| `feat/fe-b-revenue` | `main` | `main` qua PR |
| `feat/fe-c-orders` | `main` | `main` qua PR |

- Không commit trực tiếp vào `main`.
- Trước khi mở PR: `git fetch origin && git rebase origin/main`.
- Nhánh sống tối đa 1 tuần; dài hơn thì tách nhỏ PR.

## 2. Commit

Conventional commits, tiếng Việt hoặc tiếng Anh đều được, thống nhất một kiểu:

```
feat(revenue): thêm growth chart theo granularity
fix(orders): sửa funnel sai khi lọc nhiều sàn
chore(ci): cache npm trong workflow
docs(plan): cập nhật bảng phân rã sau khi chốt Figma
refactor(platform): tách formatMoney khỏi KpiCard
```

Body nêu **vì sao**, không chỉ **cái gì**. Commit nhỏ, mỗi commit một ý.

## 3. PR

1. PR ≤ 400 dòng diff (không tính fixture/test).
2. Điền đủ template, đặc biệt mục **Contract impact**.
3. CI phải xanh: `verify` là check bắt buộc.
4. Cần **1 approve từ một trong hai người còn lại** (GitHub không cho tự approve PR của mình).
5. Không tự merge PR của mình khi chạm `src/contracts/**` hoặc `src/platform/**`.

## 4. Ranh giới — điều tuyệt đối không làm

| Không được | Vì sao | Làm gì thay thế |
|---|---|---|
| Sửa `layout.tsx` | FE-A sở hữu, ai cũng sửa là conflict mỗi PR | Mở PR 3 dòng cho FE-A, hoặc đổi nội dung trong slot của mình |
| Tự parse `searchParams` | Lệch format ngày, lệch default range → số liệu 2 khối không khớp | `parseFilters()` |
| Import `@/features/orders` từ `features/revenue` | CI boundaries sẽ đỏ | Đưa phần dùng chung vào `src/platform/**` qua PR |
| Import `fixture`/`*.mock` trong component | Mock lọt vào production bundle | Dùng `queries.ts` của slice |
| Fork `KpiCard`, `DataTable` | Prop lệch nhau, sửa 1 chỗ phải sửa 3 nơi | Mở rộng bằng props/variant có sẵn |
| Thêm dependency trong PR feature | `package.json` là file chung | PR riêng cho FE-A merge |

## 5. Thêm một endpoint BE mới

```ts
// 1. src/features/revenue/contracts.ts — thêm method vào interface (additive)
export interface RevenueSource {
  // ...method cũ
  getByChannel(f: ReportFilters): Promise<ChannelRevenue[]>;
}

// 2. server/revenue.http.ts — implement bằng reportFetch + mapper
// 3. server/revenue.mock.ts — implement bằng fixture, cùng shape
// 4. server/queries.ts — bọc unstable_cache với tag của slice
// 5. component/page — chỉ đổi ở tầng UI
```

Test bắt buộc cho mapper: string → number, `null` giữ nguyên `null` (không thành 0), tổng = 0 không sinh `NaN`.

## 6. Definition of Done

- [ ] `npm run verify` xanh local
- [ ] 3 state loading / empty / error hoạt động, có screenshot trong PR
- [ ] Không file nào ngoài scope bị chạm
- [ ] Contract không đổi (hoặc có PR riêng đã merge)
- [ ] Có test cho phần logic thuần (filter, mapper, aggregate)

## 7. Khi bị conflict

1. Không sửa file của người khác để "cho hết conflict".
2. Conflict ở file thuộc owner khác → nhắn owner, họ rebase phần của họ.
3. Conflict ở `package-lock.json` → xoá lock, chạy `npm install` trên `main` mới nhất rồi commit lại.
4. Conflict lặp lại ở cùng một file → đó là dấu hiệu ranh giới sai, báo Tech Lead để tách file.
