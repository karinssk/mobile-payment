"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { lineApi, NotificationLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import {
    Bell,
    Send,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";

export default function NotificationsPage() {
    // Fetch notification logs
    const { data: notificationsData, isLoading, refetch } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const response = await lineApi.getNotifications({ limit: 100 });
            return response.data.data;
        },
    });

    // Trigger notifications mutation
    const triggerMutation = useMutation({
        mutationFn: () => lineApi.triggerNotifications(),
        onSuccess: () => {
            refetch();
        },
    });

    const getTypeLabel = (type: string) => {
        const labels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            before_due: {
                label: "แจ้งล่วงหน้า 1 วัน",
                color: "bg-blue-100 text-blue-800",
                icon: <Clock className="h-4 w-4" />,
            },
            on_due: {
                label: "แจ้งวันครบกำหนด",
                color: "bg-yellow-100 text-yellow-800",
                icon: <AlertTriangle className="h-4 w-4" />,
            },
            overdue: {
                label: "แจ้งค้างชำระ",
                color: "bg-red-100 text-red-800",
                icon: <AlertTriangle className="h-4 w-4" />,
            },
        };
        return labels[type] || { label: type, color: "bg-gray-100 text-gray-800", icon: null };
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
                    <p className="text-gray-600 mt-1">ประวัติการส่งแจ้งเตือน LINE และสถานะ</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        รีเฟรช
                    </Button>
                    <Button
                        onClick={() => triggerMutation.mutate()}
                        disabled={triggerMutation.isPending}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {triggerMutation.isPending ? "กำลังส่ง..." : "ส่งแจ้งเตือนตอนนี้"}
                    </Button>
                </div>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-blue-900">ระบบแจ้งเตือนอัตโนมัติ</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                ระบบจะส่งแจ้งเตือนอัตโนมัติทุกวันเวลา 09:00 น. ตามเวลาประเทศไทย
                                <br />• แจ้งล่วงหน้า 1 วัน ก่อนครบกำหนด
                                <br />• แจ้งในวันครบกำหนด
                                <br />• แจ้งหากมีรายการค้างชำระ
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Summary */}
            {triggerMutation.isSuccess && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="text-green-800">
                                ส่งแจ้งเตือนเรียบร้อยแล้ว! กรุณารีเฟรชเพื่อดูผลลัพธ์
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notification List */}
            <Card>
                <CardHeader>
                    <CardTitle>ประวัติการแจ้งเตือน</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
                            ))}
                        </div>
                    ) : notificationsData?.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>ยังไม่มีประวัติการแจ้งเตือน</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium text-gray-600">เวลา</th>
                                        <th className="pb-3 font-medium text-gray-600">ลูกค้า</th>
                                        <th className="pb-3 font-medium text-gray-600">รายการ</th>
                                        <th className="pb-3 font-medium text-gray-600">ประเภท</th>
                                        <th className="pb-3 font-medium text-gray-600">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {notificationsData?.map((log) => {
                                        const typeInfo = getTypeLabel(log.notification_type);
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="py-3 text-sm text-gray-600">
                                                    {formatDateTime(log.sent_at)}
                                                </td>
                                                <td className="py-3 font-medium">{log.customer_name}</td>
                                                <td className="py-3">
                                                    <div className="text-sm">
                                                        {log.product_name && <span>{log.product_name}</span>}
                                                        {log.amount && (
                                                            <span className="text-gray-500 ml-2">
                                                                {formatCurrency(log.amount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {log.due_date && (
                                                        <div className="text-xs text-gray-500">
                                                            ครบกำหนด: {formatShortDate(log.due_date)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3">
                                                    <div
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                                                    >
                                                        {typeInfo.icon}
                                                        {typeInfo.label}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {log.status === "success" ? (
                                                        <Badge variant="success">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            สำเร็จ
                                                        </Badge>
                                                    ) : (
                                                        <div>
                                                            <Badge variant="danger">
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                ล้มเหลว
                                                            </Badge>
                                                            {log.error_message && (
                                                                <p className="text-xs text-red-600 mt-1">
                                                                    {log.error_message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
