"use client";

import { useQuery } from "@tanstack/react-query";
import { paymentApi, DashboardSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await paymentApi.getSummary();
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
          <p className="text-red-600 text-sm mt-1">
            ตรวจสอบว่า Backend server กำลังทำงานอยู่ที่ http://localhost:3001
          </p>
        </div>
      </div>
    );
  }

  const summary: DashboardSummary = data || {
    total_customers: 0,
    normal_customers: 0,
    paid_customers: 0,
    overdue_customers: 0,
    pending_payments: 0,
    paid_payments: 0,
    overdue_payments: 0,
    total_collected: 0,
    total_outstanding: 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-600 mt-1">ภาพรวมระบบแจ้งหนี้ร้านผ่อนโทรศัพท์</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ลูกค้าทั้งหมด
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total_customers}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-blue-600">{summary.normal_customers} ปกติ</span>
              <span className="text-green-600">{summary.paid_customers} ครบ</span>
              <span className="text-red-600">{summary.overdue_customers} ค้าง</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              รอชำระ
            </CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {summary.pending_payments}
            </div>
            <p className="text-xs text-gray-500 mt-2">รายการที่ยังไม่ชำระ</p>
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ค้างชำระ
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {summary.overdue_payments}
            </div>
            <p className="text-xs text-gray-500 mt-2">รายการเลยกำหนด</p>
          </CardContent>
        </Card>

        {/* Paid Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ชำระแล้ว
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summary.paid_payments}
            </div>
            <p className="text-xs text-gray-500 mt-2">รายการที่ชำระเรียบร้อย</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Collected */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              ยอดรับชำระแล้ว
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {formatCurrency(summary.total_collected)}
            </div>
            <p className="text-sm text-green-600 mt-2">
              จากทั้งหมด {summary.paid_payments} รายการ
            </p>
          </CardContent>
        </Card>

        {/* Total Outstanding */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              ยอดค้างรับ
            </CardTitle>
            <div className="p-2 bg-orange-100 rounded-full">
              <Wallet className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {formatCurrency(summary.total_outstanding)}
            </div>
            <p className="text-sm text-orange-600 mt-2">
              จาก {summary.pending_payments + summary.overdue_payments} รายการที่ยังไม่ชำระ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/customers">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">จัดการลูกค้า</h3>
                  <p className="text-sm text-gray-500">เพิ่ม แก้ไข ลูกค้า</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/payments">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">ชำระเงิน</h3>
                  <p className="text-sm text-gray-500">สร้าง QR และอัพเดทสถานะ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/notifications">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <TrendingDown className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">ประวัติแจ้งเตือน</h3>
                  <p className="text-sm text-gray-500">ดูบันทึกการแจ้งเตือน</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
