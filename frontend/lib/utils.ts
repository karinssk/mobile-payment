import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format currency in Thai Baht
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format date in Thai format
export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Format short date
export function formatShortDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// Status translations
export const statusLabels: Record<string, string> = {
    normal: 'ปกติ',
    paid: 'ชำระแล้ว',
    overdue: 'ค้างชำระ',
    pending: 'รอชำระ',
};

// Status colors for badges
export const statusColors: Record<string, string> = {
    normal: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
};
