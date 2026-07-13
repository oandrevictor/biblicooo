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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem("biblicooo-theme");var theme=saved==="dark"||saved==="light"?saved:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme}catch(_){}})();`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
