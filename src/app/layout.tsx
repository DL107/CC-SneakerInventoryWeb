import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sneaker Shelf",
  description: "Your personal digital sneaker shelf — track, organize, and value your collection.",
};

const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("sneaker-shelf-theme");
    var theme = stored || "system";
    var isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
