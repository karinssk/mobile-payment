import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Types
export interface Customer {
    id: number;
    name: string;
    phone: string;
    line_user_id: string | null;
    status: 'normal' | 'paid' | 'overdue';
    created_at: string;
    updated_at: string;
}

export interface Installment {
    id: number;
    customer_id: number;
    product_name: string;
    total_amount: number;
    monthly_payment: number;
    total_months: number;
    start_date: string;
    due_day: number;
    created_at: string;
    customer_name?: string;
    customer_phone?: string;
    paid_count?: number;
    pending_count?: number;
    overdue_count?: number;
}

export interface Payment {
    id: number;
    installment_id: number;
    month_number: number;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    paid_at: string | null;
    omise_charge_id: string | null;
    qr_code_data: string | null;
    product_name?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_id?: number;
    total_months?: number;
}

export interface DashboardSummary {
    total_customers: number;
    normal_customers: number;
    paid_customers: number;
    overdue_customers: number;
    pending_payments: number;
    paid_payments: number;
    overdue_payments: number;
    total_collected: number;
    total_outstanding: number;
}

export interface NotificationLog {
    id: number;
    payment_id: number;
    customer_id: number;
    notification_type: 'before_due' | 'on_due' | 'overdue';
    sent_at: string;
    status: 'success' | 'failed';
    error_message: string | null;
    customer_name?: string;
    product_name?: string;
    due_date?: string;
    amount?: number;
}

// API Response type
interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

// Customer API
export const customerApi = {
    getAll: (params?: { status?: string; search?: string }) =>
        api.get<ApiResponse<Customer[]>>('/customers', { params }),

    getById: (id: number) =>
        api.get<ApiResponse<Customer & { installments: Installment[] }>>(`/customers/${id}`),

    create: (data: Partial<Customer>) =>
        api.post<ApiResponse<Customer>>('/customers', data),

    update: (id: number, data: Partial<Customer>) =>
        api.put<ApiResponse<Customer>>(`/customers/${id}`, data),

    updateStatus: (id: number, status: string) =>
        api.put<ApiResponse<Customer>>(`/customers/${id}/status`, { status }),

    delete: (id: number) =>
        api.delete<ApiResponse<{ message: string }>>(`/customers/${id}`),
};

// Installment API
export const installmentApi = {
    getAll: (params?: { customer_id?: number }) =>
        api.get<ApiResponse<Installment[]>>('/installments', { params }),

    getById: (id: number) =>
        api.get<ApiResponse<Installment & { payments: Payment[] }>>(`/installments/${id}`),

    create: (data: Partial<Installment>) =>
        api.post<ApiResponse<Installment & { payments: Payment[] }>>('/installments', data),

    update: (id: number, data: Partial<Installment>) =>
        api.put<ApiResponse<Installment>>(`/installments/${id}`, data),

    delete: (id: number) =>
        api.delete<ApiResponse<{ message: string }>>(`/installments/${id}`),
};

// Payment API
export const paymentApi = {
    getAll: (params?: { status?: string; customer_id?: number; from_date?: string; to_date?: string }) =>
        api.get<ApiResponse<Payment[]>>('/payments', { params }),

    getById: (id: number) =>
        api.get<ApiResponse<Payment>>(`/payments/${id}`),

    updateStatus: (id: number, status: string) =>
        api.put<ApiResponse<Payment>>(`/payments/${id}/status`, { status }),

    generateQRCode: (id: number, sendToLine?: boolean) =>
        api.post<ApiResponse<{ qrCodeUrl: string; chargeId: string; expiresAt: string }>>(`/payments/${id}/qrcode`, { send_to_line: sendToLine }),

    checkPayment: (id: number) =>
        api.get<ApiResponse<{ omiseStatus: string; paid: boolean; paymentStatus: string }>>(`/payments/${id}/check-payment`),

    getSummary: () =>
        api.get<ApiResponse<DashboardSummary>>('/payments/summary/dashboard'),
};

// LINE API
export const lineApi = {
    linkCustomer: (customerId: number, lineUserId: string) =>
        api.post<ApiResponse<Customer>>('/line/link', { customer_id: customerId, line_user_id: lineUserId }),

    sendTestMessage: (customerId: number, message?: string) =>
        api.post<ApiResponse<{ success: boolean }>>('/line/test-message', { customer_id: customerId, message }),

    triggerNotifications: () =>
        api.post<ApiResponse<object>>('/line/trigger-notifications'),

    getNotifications: (params?: { customer_id?: number; limit?: number }) =>
        api.get<ApiResponse<NotificationLog[]>>('/line/notifications', { params }),
};
