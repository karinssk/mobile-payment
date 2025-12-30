"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Settings,
    MessageCircle,
    CreditCard,
    Bell,
    ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า</h1>
                <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบ</p>
            </div>

            {/* LINE Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        LINE Official Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">การตั้งค่า LINE Messaging API</h4>
                        <p className="text-sm text-blue-700 mb-3">
                            ตั้งค่าใน Backend <code className="bg-blue-100 px-1 rounded">.env</code> ไฟล์:
                        </p>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                            {`LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here`}
                        </pre>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Webhook URL
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={`${typeof window !== 'undefined' ? window.location.origin.replace('3000', '3001') : ''}/webhook/webhook`}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const url = `${window.location.origin.replace('3000', '3001')}/webhook/webhook`;
                                    navigator.clipboard.writeText(url);
                                    alert('คัดลอก URL แล้ว!');
                                }}
                            >
                                คัดลอก
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            ใช้ URL นี้ตั้งค่าใน LINE Developers Console
                        </p>
                    </div>

                    <div className="pt-4">
                        <a
                            href="https://developers.line.biz/console/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" className="gap-2">
                                <ExternalLink className="h-4 w-4" />
                                เปิด LINE Developers Console
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* Omise Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Omise Payment
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">การตั้งค่า Omise API</h4>
                        <p className="text-sm text-blue-700 mb-3">
                            ตั้งค่าใน Backend <code className="bg-blue-100 px-1 rounded">.env</code> ไฟล์:
                        </p>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto">
                            {`OMISE_PUBLIC_KEY=pkey_test_xxxxx
OMISE_SECRET_KEY=skey_test_xxxxx`}
                        </pre>
                    </div>

                    <div className="pt-4">
                        <a
                            href="https://dashboard.omise.co/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" className="gap-2">
                                <ExternalLink className="h-4 w-4" />
                                เปิด Omise Dashboard
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-purple-600" />
                        การแจ้งเตือน
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">ตารางเวลาแจ้งเตือนอัตโนมัติ</h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-sm">แจ้งล่วงหน้า 1 วัน (ก่อนครบกำหนด)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    <span className="text-sm">แจ้งในวันครบกำหนด</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="text-sm">แจ้งเมื่อเลยกำหนด (อัพเดทสถานะเป็นค้างชำระ)</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">เวลาส่งแจ้งเตือน</h4>
                            <p className="text-sm text-gray-600">
                                ระบบจะส่งแจ้งเตือนอัตโนมัติทุกวัน เวลา <strong>09:00 น.</strong> (Asia/Bangkok)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Database Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-gray-600" />
                        ข้อมูลระบบ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Backend URL:</span>
                            <p className="font-mono">http://localhost:3001</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Database:</span>
                            <p className="font-mono">MySQL (Port 8888)</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Frontend:</span>
                            <p className="font-mono">Next.js 16 + React 19</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Payment:</span>
                            <p className="font-mono">Omise PromptPay</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
