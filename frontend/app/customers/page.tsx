"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerApi, Customer } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { statusLabels } from "@/lib/utils";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Phone,
    User,
    X,
    MessageCircle,
} from "lucide-react";

export default function CustomersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        line_user_id: "",
    });

    // Fetch customers
    const { data: customersData, isLoading } = useQuery({
        queryKey: ["customers", search, statusFilter],
        queryFn: async () => {
            const response = await customerApi.getAll({
                search: search || undefined,
                status: statusFilter || undefined,
            });
            return response.data.data;
        },
    });

    // Create customer mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<Customer>) => customerApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            closeModal();
        },
    });

    // Update customer mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
            customerApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            closeModal();
        },
    });

    // Delete customer mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => customerApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            customerApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });

    const openModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone,
                line_user_id: customer.line_user_id || "",
            });
        } else {
            setEditingCustomer(null);
            setFormData({ name: "", phone: "", line_user_id: "" });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        setFormData({ name: "", phone: "", line_user_id: "" });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("คุณต้องการลบลูกค้านี้หรือไม่?")) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "success" | "warning" | "danger" | "info"> = {
            normal: "info",
            paid: "success",
            overdue: "danger",
        };
        return (
            <Badge variant={variants[status] || "secondary"}>
                {statusLabels[status] || status}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ลูกค้า</h1>
                    <p className="text-gray-600 mt-1">จัดการข้อมูลลูกค้าทั้งหมด</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มลูกค้า
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                        >
                            <option value="">สถานะทั้งหมด</option>
                            <option value="normal">ปกติ</option>
                            <option value="paid">ชำระแล้ว</option>
                            <option value="overdue">ค้างชำระ</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Customer List */}
            <Card>
                <CardHeader>
                    <CardTitle>รายชื่อลูกค้า ({customersData?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>
                            ))}
                        </div>
                    ) : customersData?.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>ยังไม่มีลูกค้า</p>
                            <Button variant="outline" className="mt-4" onClick={() => openModal()}>
                                เพิ่มลูกค้าคนแรก
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium text-gray-600">ชื่อ</th>
                                        <th className="pb-3 font-medium text-gray-600">เบอร์โทร</th>
                                        <th className="pb-3 font-medium text-gray-600">LINE</th>
                                        <th className="pb-3 font-medium text-gray-600">สถานะ</th>
                                        <th className="pb-3 font-medium text-gray-600 text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {customersData?.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <span className="font-medium">{customer.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="h-4 w-4" />
                                                    {customer.phone}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                {customer.line_user_id ? (
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span className="text-sm">เชื่อมต่อแล้ว</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">ยังไม่เชื่อมต่อ</span>
                                                )}
                                            </td>
                                            <td className="py-4">{getStatusBadge(customer.status)}</td>
                                            <td className="py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <select
                                                        value={customer.status}
                                                        onChange={(e) =>
                                                            updateStatusMutation.mutate({
                                                                id: customer.id,
                                                                status: e.target.value,
                                                            })
                                                        }
                                                        className="text-xs px-2 py-1 border rounded"
                                                    >
                                                        <option value="normal">ปกติ</option>
                                                        <option value="paid">ชำระแล้ว</option>
                                                        <option value="overdue">ค้างชำระ</option>
                                                    </select>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openModal(customer)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(customer.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                {editingCustomer ? "แก้ไขลูกค้า" : "เพิ่มลูกค้าใหม่"}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={closeModal}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อลูกค้า *
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ชื่อ-นามสกุล"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เบอร์โทรศัพท์ *
                                </label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="0812345678"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    LINE User ID
                                </label>
                                <Input
                                    value={formData.line_user_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, line_user_id: e.target.value })
                                    }
                                    placeholder="Uxxxxxxxxx (จาก LINE webhook)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    ได้รับจาก LINE เมื่อลูกค้า add เป็นเพื่อน
                                </p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                                    ยกเลิก
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {editingCustomer ? "บันทึก" : "เพิ่มลูกค้า"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
