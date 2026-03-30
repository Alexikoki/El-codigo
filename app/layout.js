import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import CookieBanner from "../components/CookieBanner";
import SessionWarning from "../components/SessionWarning";
import { LanguageProvider } from "../lib/i18n/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "itrustb2b — Sistema de Referidos QR",
  description: "Plataforma de referidos QR para hostelería y turismo. Traquea comisiones, valida clientes y gestiona tu equipo.",
  manifest: "/manifest.json",
  themeColor: "#fafaf8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "itrustb2b",
  },
};

export const viewport = {
  themeColor: "#fafaf8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="itrustb2b" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#111111',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#1e3a5f', secondary: '#fff' } }
          }}
        />
        <CookieBanner />
        <SessionWarning />
        </LanguageProvider>
        {/* Registrador del Service Worker PWA */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.warn('SW registration failed:', err);
                });
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
