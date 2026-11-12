import { z } from 'zod';

/** Response THÔ của GET /admin/orders/:publicId?view=growthDrawer */
const rawItem = z.object({
  itemId: z.union([z.string(), z.number()]),
  productName: z.string(),
  sku: z.string().nullish().default(null),
  quantity: z.number(),
  unitPriceVnd: z.string(),
  lineSubtotalVnd: z.string(),
});

const rawDiscount = z.object({
  kind: z.enum([
    'SANH',
    'PRODUCT_DISCOUNT',
    'SELLER_VOUCHER',
    'PLATFORM_VOUCHER',
    'SHIPPING_SUPPORT',
  ]),
  labelKey: z.string(),
  amountVnd: z.string(),
  includedIn: z.enum(['PRODUCT', 'SELLER', 'PLATFORM', 'SHIPPING']),
  fundedBy: z.enum(['PLATFORM', 'SELLER', 'MIXED', 'UNKNOWN']).default('UNKNOWN'),
  sellerFundedVnd: z.string().nullish().default(null),
  platformFundedVnd: z.string().nullish().default(null),
});

const rawMilestone = z.object({
  code: z.enum([
    'PLACED',
    'CONFIRMED',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]),
  occurredAt: z.string().nullish().default(null),
  source: z.enum(['ORDER', 'FULFILLMENT', 'SHIPMENT_EVENT']).nullish().default(null),
});

export const orderDrawerSchema = z.object({
  orderPublicId: z.string(),
  status: z.enum([
    'PENDING_PROCESSING',
    'PREPARING_SHIPMENT',
    'COMPLETED',
    'CANCELLED',
    'NEEDS_RESOLUTION',
  ]),
  state: z.string().nullish().default(null),
  hasSanhBenefit: z.boolean().default(false),
  customer: z.object({
    customerId: z.string(),
    customerName: z.string().nullish().default(null),
    maskedPhone: z.string().nullish().default(null),
  }),
  seller: z.object({
    sellerId: z.string(),
    sellerCode: z.string().nullish().default(null),
    sellerName: z.string().nullish().default(null),
  }),
  regionName: z.string().nullish().default(null),
  payment: z.object({
    method: z.enum(['COD', 'NO_CASH', 'REFUND']).nullish().default(null),
    status: z.enum(['waiting', 'success', 'failed']).nullish().default(null),
  }),
  placedAt: z.string(),
  items: z.array(rawItem),
  discountBreakdown: z.array(rawDiscount).default([]),
  totals: z.object({
    subtotalVnd: z.string(),
    shippingFeeVnd: z.string(),
    totalDiscountVnd: z.string(),
    orderTotalVnd: z.string(),
  }),
  delivery: z.object({
    carrierName: z.string().nullish().default(null),
    trackingCode: z.string().nullish().default(null),
    milestones: z.array(rawMilestone).default([]),
    timelineIntegrity: z.enum(['OK', 'INCOMPLETE', 'OUT_OF_ORDER']),
  }),
  dataQualityFlags: z
    .array(
      z.enum([
        'MONEY_MISMATCH',
        'DISCOUNT_MISMATCH',
        'UNVERIFIED_LEGACY_DISCOUNT',
        'PACKED_TIMESTAMP_UNAVAILABLE',
        'SHIPMENT_PARTIAL',
        'TIMELINE_OUT_OF_ORDER',
      ]),
    )
    .default([]),
});

export type RawOrderDrawer = z.infer<typeof orderDrawerSchema>;
