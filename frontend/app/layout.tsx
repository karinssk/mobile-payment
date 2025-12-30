import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Layout } from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: "ระบบแจ้งหนี้ร้านผ่อนโทรศัพท์",
  description: "ระบบแจ้งเตือนการชำระเงินผ่าน LINE สำหรับร้านผ่อนโทรศัพท์มือถือ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
