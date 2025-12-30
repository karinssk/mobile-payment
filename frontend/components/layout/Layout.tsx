"use client";

import { Sidebar } from "./Sidebar";

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            {/* Main content */}
            <main className="lg:pl-64 pt-16 lg:pt-0">
                <div className="min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
