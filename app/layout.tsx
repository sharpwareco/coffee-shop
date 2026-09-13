import type { Metadata } from "next";
import Link from "next/link";
import { CartLink } from "@/components/cart-link";
import { CartProvider } from "@/components/cart-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midnight Coffee",
  description: "Simple coffee shop e-commerce training skeleton"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header className="site-header">
            <div className="container nav">
              <Link href="/" className="brand">Midnight Coffee</Link>
              <nav>
                <Link href="/">Shop</Link>
                <CartLink />
                <Link href="/admin">Admin</Link>
              </nav>
            </div>
          </header>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
