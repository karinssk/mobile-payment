"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { installmentApi, customerApi, Installment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import {
    Plus,
    Smartphone,
    X,
    ChevronRight,
    Calendar,
    User,
} from "lucide-react";
import Link from "next/link";

export default function InstallmentsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        customer_id: "",
        product_name: "",
        total_amount: "",
        monthly_payment: "",
        total_months: "",
        start_date: new Date().toISOString().split("T")[0],
        due_day: "1",
    });

    // Fetch installments
    const { data: installmentsData, isLoading } = useQuery({
        queryKey: ["installments"],
        queryFn: async () => {
            const response = await installmentApi.getAll();
            return response.data.data;
        },
    });

    // Fetch customers for dropdown
    const { data: customersData } = useQuery({
        queryKey: ["customers-list"],
        queryFn: async () => {
            const response = await customerApi.getAll();
            return response.data.data;
        },
    });

    // Create installment mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<Installment>) => installmentApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["installments"] });
            closeModal();
        },
    });

    const openModal = () => {
        setFormData({
            customer_id: "",
            product_name: "",
            total_amount: "",
            monthly_payment: "",
            total_months: "",
            start_date: new Date().toISOString().split("T")[0],
            due_day: "1",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            customer_id: parseInt(formData.customer_id),
            product_name: formData.product_name,
            total_amount: parseFloat(formData.total_amount),
            monthly_payment: parseFloat(formData.monthly_payment),
            total_months: parseInt(formData.total_months),
            start_date: formData.start_date,
            due_day: parseInt(formData.due_day),
        });
    };

    const calculateMonthlyPayment = () => {
        const total = parseFloat(formData.total_amount);
        const months = parseInt(formData.total_months);
        if (total && months) {
            setFormData({
                ...formData,
                monthly_payment: (total / months).toFixed(2),
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">รายการผ่อน</h1>
                    <p className="text-gray-600 mt-1">จัดการรายการผ่อนชำระทั้งหมด</p>
                </div>
                <Button onClick={openModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    สร้างรายการผ่อน
                </Button>
            </div>

            {/* Installment List */}
            <div className="space-y-4">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6 h-32 bg-gray-100"></CardContent>
                        </Card>
                    ))
                ) : installmentsData?.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">ยังไม่มีรายการผ่อน</p>
                            <Button className="mt-4" onClick={openModal}>
                                สร้างรายการผ่อนแรก
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    installmentsData?.map((installment) => (
                        <Card key={installment.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <Smartphone className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{installment.product_name}</h3>
                                            <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                                                <User className="h-4 w-4" />
                                                {installment.customer_name}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                                <Calendar className="h-4 w-4" />
                                                เริ่ม: {formatShortDate(installment.start_date)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="text-center px-4">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {formatCurrency(installment.monthly_payment)}
                                            </p>
                                            <p className="text-xs text-gray-500">ต่อเดือน</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Badge variant="success">{installment.paid_count || 0} ชำระแล้ว</Badge>
                                            <Badge variant="warning">{installment.pending_count || 0} รอชำระ</Badge>
                                            {(installment.overdue_count || 0) > 0 && (
                                                <Badge variant="danger">{installment.overdue_count} ค้าง</Badge>
                                            )}
                                        </div>

                                        <Link href={`/installments/${installment.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <ChevronRight className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>ความคืบหน้า</span>
                                        <span>
                                            {installment.paid_count || 0}/{installment.total_months} งวด
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all"
                                            style={{
                                                width: `${((installment.paid_count || 0) / installment.total_months) * 100
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">สร้างรายการผ่อนใหม่</h2>
                            <Button variant="ghost" size="icon" onClick={closeModal}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ลูกค้า *
                                </label>
                                <select
                                    value={formData.customer_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customer_id: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                                    required
                                >
                                    <option value="">-- เลือกลูกค้า --</option>
                                    {customersData?.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} ({customer.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อสินค้า *
                                </label>
                                <Input
                                    value={formData.product_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, product_name: e.target.value })
                                    }
                                    placeholder="เช่น iPhone 15 Pro Max 256GB"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ราคารวม (บาท) *
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.total_amount}
                                        onChange={(e) =>
                                            setFormData({ ...formData, total_amount: e.target.value })
                                        }
                                        onBlur={calculateMonthlyPayment}
                                        placeholder="48900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        จำนวนงวด *
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.total_months}
                                        onChange={(e) =>
                                            setFormData({ ...formData, total_months: e.target.value })
                                        }
                                        onBlur={calculateMonthlyPayment}
                                        placeholder="12"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ยอดผ่อนต่อเดือน (บาท) *
                                </label>
                                <Input
                                    type="number"
                                    value={formData.monthly_payment}
                                    onChange={(e) =>
                                        setFormData({ ...formData, monthly_payment: e.target.value })
                                    }
                                    placeholder="4075"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        วันเริ่มผ่อน *
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, start_date: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        วันครบกำหนดในเดือน *
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData.due_day}
                                        onChange={(e) =>
                                            setFormData({ ...formData, due_day: e.target.value })
                                        }
                                        placeholder="1"
                                        min="1"
                                        max="28"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                    className="flex-1"
                                >
                                    ยกเลิก
                                </Button>
                                <Button type="submit" className="flex-1">
                                    สร้างรายการผ่อน
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
