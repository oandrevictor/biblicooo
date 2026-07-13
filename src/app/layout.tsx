import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biblicooo",
  description: "Adivinhe o personagem ou lugar biblico do dia."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
