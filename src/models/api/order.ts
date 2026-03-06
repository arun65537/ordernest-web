import type { Uuid } from "./common";

export type OrderStatus = "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "CONFIRMED" | "CANCELLED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "PAID" | "FAILED" | "REFUNDED";

export interface CreateOrderRequest {
  item: {
    productId: Uuid;
    quantity: number;
  };
}

export interface CreateOrderResponse {
  orderId: Uuid;
}

export interface OrderItemResponse {
  productId: Uuid;
  productName: string;
  quantity: number;
  totalAmount: number;
  currency: string;
}

export interface OrderResponse {
  orderId: Uuid;
  item: OrderItemResponse;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export type GetOrderByIdResponse = OrderResponse;

export type GetOrdersByUserIdResponse = OrderResponse[];
