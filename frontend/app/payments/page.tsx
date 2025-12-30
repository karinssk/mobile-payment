"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi, Payment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate, statusLabels } from "@/lib/utils";
import {
    CreditCard,
    QrCode,
    CheckCircle,
    Clock,
    AlertTriangle,
    X,
    Send,
    RefreshCw,
} from "lucide-react";

export default function PaymentsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("");
    const [qrModal, setQrModal] = useState<{
        show: boolean;
        qrCodeUrl?: string;
        payment?: Payment;
    }>({ show: false });

    // Fetch payments
    const { data: paymentsData, isLoading } = useQuery({
        queryKey: ["payments", statusFilter],
        queryFn: async () => {
            const response = await paymentApi.getAll({
                status: statusFilter || undefined,
            });
            return response.data.data;
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            paymentApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
        },
    });

    // Generate QR mutation
    const generateQRMutation = useMutation({
        mutationFn: ({ id, sendToLine }: { id: number; sendToLine?: boolean }) =>
            paymentApi.generateQRCode(id, sendToLine),
        onSuccess: (response, variables) => {
            const payment = paymentsData?.find((p) => p.id === variables.id);
            setQrModal({
                show: true,
                qrCodeUrl: response.data.data.qrCodeUrl,
                payment,
            });
        },
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "paid":
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case "overdue":
                return <AlertTriangle className="h-5 w-5 text-red-600" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "success" | "warning" | "danger"> = {
            pending: "warning",
            paid: "success",
            overdue: "danger",
        };
        return (
            <Badge variant={variants[status] || "secondary"}>
                {statusLabels[status] || status}
            </Badge>
        );
    };

    // Group payments by date
    const groupedPayments = paymentsData?.reduce((groups, payment) => {
        const date = payment.due_date.split("T")[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(payment);
        return groups;
    }, {} as Record<string, Payment[]>);

    const sortedDates = Object.keys(groupedPayments || {}).sort();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">การชำระเงิน</h1>
                    <p className="text-gray-600 mt-1">จัดการรายการชำระเงินและสร้าง QR Code</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { value: "", label: "ทั้งหมด", icon: CreditCard },
                    { value: "pending", label: "รอชำระ", icon: Clock },
                    { value: "overdue", label: "ค้างชำระ", icon: AlertTriangle },
                    { value: "paid", label: "ชำระแล้ว", icon: CheckCircle },
                ].map((filter) => (
                    <Button
                        key={filter.value}
                        variant={statusFilter === filter.value ? "default" : "outline"}
                        onClick={() => setStatusFilter(filter.value)}
                        className="gap-2"
                    >
                        <filter.icon className="h-4 w-4" />
                        {filter.label}
                    </Button>
                ))}
            </div>

            {/* Payment List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6 h-24 bg-gray-100"></CardContent>
                        </Card>
                    ))}
                </div>
            ) : paymentsData?.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">ไม่มีรายการชำระเงิน</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map((date) => (
                        <div key={date}>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">
                                {formatShortDate(date)}
                            </h3>
                            <div className="space-y-3">
                                {groupedPayments![date].map((payment) => (
                                    <Card key={payment.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-gray-100 rounded-lg">
                                                        {getStatusIcon(payment.status)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{payment.product_name}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            {payment.customer_name} • งวดที่ {payment.month_number}
                                                            {payment.total_months && `/${payment.total_months}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold">
                                                            {formatCurrency(payment.amount)}
                                                        </p>
                                                        {getStatusBadge(payment.status)}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {payment.status !== "paid" && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        generateQRMutation.mutate({ id: payment.id })
                                                                    }
                                                                    disabled={generateQRMutation.isPending}
                                                                >
                                                                    <QrCode className="h-4 w-4 mr-1" />
                                                                    QR
                                                                </Button>
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        updateStatusMutation.mutate({
                                                                            id: payment.id,
                                                                            status: "paid",
                                                                        })
                                                                    }
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                                    ชำระแล้ว
                                                                </Button>
                                                            </>
                                                        )}
                                                        {payment.status === "paid" && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    updateStatusMutation.mutate({
                                                                        id: payment.id,
                                                                        status: "pending",
                                                                    })
                                                                }
                                                            >
                                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                                ยกเลิก
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* QR Code Modal */}
            {qrModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setQrModal({ show: false })} />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">QR Code ชำระเงิน</h2>
                            <Button variant="ghost" size="icon" onClick={() => setQrModal({ show: false })}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {qrModal.qrCodeUrl ? (
                            <div className="text-center">
                                <div className="bg-white p-4 rounded-lg border mb-4">
                                    <img
                                        src={qrModal.qrCodeUrl}
                                        alt="QR Code"
                                        className="w-full max-w-[250px] mx-auto"
                                    />
                                </div>
                                <p className="font-medium">{qrModal.payment?.product_name}</p>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                    {formatCurrency(qrModal.payment?.amount || 0)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    งวดที่ {qrModal.payment?.month_number}
                                </p>

                                <div className="flex gap-2 mt-6">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() =>
                                            generateQRMutation.mutate({
                                                id: qrModal.payment!.id,
                                                sendToLine: true,
                                            })
                                        }
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        ส่ง LINE
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => setQrModal({ show: false })}
                                    >
                                        ปิด
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                                <p className="mt-2 text-gray-500">กำลังสร้าง QR Code...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
