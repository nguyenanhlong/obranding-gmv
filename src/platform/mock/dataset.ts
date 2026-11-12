import type { OrderRow, OrderStatus } from '@/contracts/base';
import { addDays, daysBetweenRange, parseDate } from '@/platform/time';

/**
 * Dataset deterministic dùng chung cho cả 3 màn.
 * Sinh một lần, cache trong module — mọi slice đọc cùng nguồn nên số liệu khớp nhau.
 *
 * TODO: thay bằng dữ liệu BE khi DATA_SOURCE=api. Không slice nào được import trực tiếp
 * file này ngoài server/mock.ts của chính nó.
 */

export type MockOrder = OrderRow & {
  subTotal: number;
  shippingFee: number;
  confirmedAt: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
};

export type Seller = { id: string; code: string; name: string; category: string };
export type Customer = { id: string; name: string; phone: string; region: string };

export const DATASET_FROM = '2025-11-01';
export const DATASET_TO = '2026-10-27';

const REGIONS = [
  'Thành phố Hà Nội',
  'Thành phố Hồ Chí Minh',
  'Thành phố Đà Nẵng',
  'Thành phố Cần Thơ',
  'Tỉnh Đồng Tháp',
  'Tỉnh An Giang',
  'Tỉnh Đắk Lắk',
  'Tỉnh Bắc Ninh',
];

const CATEGORIES = [
  'Thực phẩm & Đồ uống',
  'Nhà cửa và Đời sống',
  'Sắc đẹp',
  'Mẹ & Bé',
  'Sở thích & sưu tầm',
  'Thời trang',
];

const SELLER_NAMES = [
  'CÔNG TY TNHH GỐM LAM BÁT TRÀNG',
  'HỘ KINH DOANH YẾN SÀO KHÁNH PHONG',
  'CÔNG TY CỔ PHẦN CÀ PHÊ ĐẤT ĐỎ',
  'CÔNG TY TNHH TRÀ TÂN CƯƠNG XANH',
  'MỘC HƯƠNG COSMETICS',
  'CÔNG TY TNHH NƯỚC MẮM CỬA BIỂN',
  'MÂY TRE PHÚ VINH',
  'BÁNH PÍA SÓC TRĂNG XƯA',
  'CÔNG TY TNHH ĐỒ CHƠI GỖ BÉ NA',
  'TRẦM HƯƠNG KHÁNH HOÀ',
];

const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];
const MIDDLE_NAMES = ['Minh', 'Quốc', 'Thảo', 'Ngọc', 'Đức', 'Gia', 'Hải', 'Bảo', 'Anh', 'Tuấn'];
const LAST_NAMES = ['Anh', 'Bảo', 'Linh', 'Huy', 'Mai', 'Vinh', 'Kiệt', 'Nguyên', 'Hải', 'Thư'];

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

function buildSellers(): Seller[] {
  return Array.from({ length: 60 }, (_, i) => ({
    id: `seller-${i + 1}`,
    code: `SL${String(1000 + i * 7).padStart(7, '0')}`,
    name: `${SELLER_NAMES[i % SELLER_NAMES.length]}${i >= SELLER_NAMES.length ? ` ${Math.floor(i / 10) + 1}` : ''}`,
    category: CATEGORIES[i % CATEGORIES.length] ?? CATEGORIES[0]!,
  }));
}

function buildCustomers(): Customer[] {
  return Array.from({ length: 400 }, (_, i) => {
    const last = LAST_NAMES[i % LAST_NAMES.length] ?? 'An';
    const mid = MIDDLE_NAMES[(i * 3) % MIDDLE_NAMES.length] ?? 'Minh';
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length] ?? 'Nguyễn';
    return {
      id: `customer-${i + 1}`,
      name: `${first} ${mid} ${last}`,
      phone: `09${String(10000000 + i * 137).slice(0, 8)}`,
      region: REGIONS[i % REGIONS.length] ?? REGIONS[0]!,
    };
  });
}

function buildOrders(): MockOrder[] {
  const rand = lcg(20261027);
  const sellers = buildSellers();
  const customers = buildCustomers();
  const days = daysBetweenRange(DATASET_FROM, DATASET_TO);
  const orders: MockOrder[] = [];
  let seq = 0;

  days.forEach((date, dayIndex) => {
    const dow = parseDate(date).getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 1.25 : 1;
    const trend = 1 + dayIndex * 0.0015;
    const count = Math.round((9 + rand() * 6) * weekend * trend);

    for (let k = 0; k < count; k += 1) {
      seq += 1;
      const seller = sellers[Math.floor(rand() * sellers.length)] ?? sellers[0]!;
      // Bể khách nở dần theo thời gian để tỉ lệ khách mới có ý nghĩa
      const poolSize = Math.min(customers.length, 40 + Math.floor(dayIndex * 1.05));
      const customer = customers[Math.floor(rand() * poolSize)] ?? customers[0]!;

      const r = rand();
      const status: OrderStatus =
        r < 0.78
          ? 'COMPLETED'
          : r < 0.86
            ? 'PREPARING'
            : r < 0.92
              ? 'PENDING'
              : r < 0.97
                ? 'CANCELLED'
                : 'NEEDS_RESOLUTION';

      const itemCount = 1 + Math.floor(rand() * 4);
      const unitPrice = Math.round((80_000 + rand() * 1_600_000) / 1000) * 1000;
      const subTotal = unitPrice * itemCount;
      const shippingFee = rand() < 0.25 ? 0 : 25_000;

      const sanhDiscount = customer.id.endsWith('0') ? Math.round(subTotal * 0.05) : 0;
      const direct = customer.id.endsWith('0') ? 0 : Math.round(subTotal * 0.04);
      const sellerDiscount = Math.round(subTotal * 0.03);
      const platformDiscount = rand() < 0.3 ? Math.round(subTotal * 0.02) : 0;
      const shippingDiscount = rand() < 0.6 ? 20_000 : 0;

      const totalDiscount = sanhDiscount + direct + sellerDiscount + platformDiscount;
      const total = Math.max(0, subTotal - totalDiscount + shippingFee - shippingDiscount);

      const discounts = [
        ...(sanhDiscount > 0 ? [{ label: 'Thẻ Sành', amount: sanhDiscount }] : []),
        ...(direct > 0 ? [{ label: 'Giảm giá SP', amount: direct }] : []),
        ...(sellerDiscount > 0 ? [{ label: 'Voucher shop', amount: sellerDiscount }] : []),
        ...(platformDiscount > 0 ? [{ label: 'Voucher sàn', amount: platformDiscount }] : []),
        ...(shippingDiscount > 0 ? [{ label: 'Hỗ trợ ship', amount: shippingDiscount }] : []),
      ];

      const hour = 7 + Math.floor(rand() * 16);
      const minute = Math.floor(rand() * 60);
      const placedAt = `${date}T${pad(hour)}:${pad(minute)}:${pad(Math.floor(rand() * 60))}+07:00`;

      const later = (daysAfter: number) => (status === 'CANCELLED' ? null : `${addDays(date, daysAfter)}T10:00:00+07:00`);

      orders.push({
        id: `order-${seq}`,
        publicId: `26${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}${String(seq).padStart(8, '0')}AB`,
        placedAt,
        status,
        sellerId: seller.id,
        sellerCode: seller.code,
        sellerName: seller.name,
        customerId: customer.id,
        customerName: customer.name,
        category: seller.category,
        region: customer.region,
        itemCount,
        payment: rand() < 0.7 ? 'COD' : 'PREPAID',
        discounts,
        total: { amount: total, currency: 'VND' },
        subTotal,
        shippingFee,
        confirmedAt: later(0),
        packedAt: later(1),
        shippedAt: later(2),
        deliveredAt: status === 'COMPLETED' ? later(4) : null,
        cancelledAt:
          status === 'CANCELLED' ? `${addDays(date, 1)}T09:00:00+07:00` : null,
        productName: `Sản phẩm ${String(seq % 97)} của ${seller.name.split(' ')[0] ?? 'shop'}`,
        sku: `${String(1200 + (seq % 200))}-${String(100 + (seq % 90))}`,
        unitPrice,
      });
    }
  });

  return orders;
}

let orderCache: MockOrder[] | null = null;

export function allOrders(): MockOrder[] {
  orderCache ??= buildOrders();
  return orderCache;
}

export function sellers(): Seller[] {
  return buildSellers();
}

export function customers(): Customer[] {
  return buildCustomers();
}

/** Ngày của đơn (bỏ phần giờ) để so sánh với filter */
export function orderDate(o: OrderRow): string {
  return o.placedAt.slice(0, 10);
}

export function isCounted(o: OrderRow): boolean {
  return o.status !== 'CANCELLED';
}
