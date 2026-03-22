import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "doda 求人票ジェネレーター | 営業担当向け自動作成ツール",
  description:
    "顧客情報を貼り付けるだけで、doda形式の高品質な求人票を自動生成します。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
