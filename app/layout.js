import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { OrderProvider } from "../context/OrderContext";
import { LanguageProvider } from "../context/LanguageContext";
import ClientShell from "../components/ClientShell";

export const metadata = {
  title: "QurbanEt",
  description: "Etibarli · Halal · Sürətli",
  icons: { icon: "/logo.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <OrderProvider>
            <LanguageProvider>
              <ClientShell>{children}</ClientShell>
            </LanguageProvider>
          </OrderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
