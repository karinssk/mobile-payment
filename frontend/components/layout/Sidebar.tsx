"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Bell,
    Settings,
    Smartphone,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "แดชบอร์ด", href: "/", icon: LayoutDashboard },
    { name: "ลูกค้า", href: "/customers", icon: Users },
    { name: "รายการผ่อน", href: "/installments", icon: Smartphone },
    { name: "การชำระเงิน", href: "/payments", icon: CreditCard },
    { name: "การแจ้งเตือน", href: "/notifications", icon: Bell },
    { name: "ตั้งค่า", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white border-b px-4 h-16">
                <div className="flex items-center gap-2">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-lg">ร้านผ่อนโทรศัพท์</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-md hover:bg-gray-100"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 h-16 border-b">
                        <Smartphone className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="font-bold text-lg leading-tight">ร้านผ่อนโทรศัพท์</h1>
                            <p className="text-xs text-gray-500">ระบบแจ้งหนี้ LINE</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="px-4 py-4 border-t">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                                <p className="text-xs text-gray-500 truncate">admin@shop.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
