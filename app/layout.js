import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { OrderProvider } from "../context/OrderContext";
import { LanguageProvider } from "../context/LanguageContext";
import { NotificationProvider } from "../context/NotificationContext";
import ClientShell from "../components/ClientShell";
import VersionChecker from "../components/VersionChecker";

const BASE_URL = "https://meatbox.az";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: "MeatBox",
  description:
    "MeatBox ilə qurbanınızı onlayn sifariş edin. Etibarlı, halal və sürətli xidmət. Azərbaycanda qurban kəsim platforması.",
  keywords: ["qurban", "meatbox", "qurban kes", "halal", "azerbaycan", "et"],
  icons: { icon: "/meatbox_icon.png", apple: "/meatbox_icon.png" },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "MeatBox",
    title: "MeatBox",
    description:
      "MeatBox ilə qurbanınızı onlayn sifariş edin. Etibarlı, halal və sürətli xidmət. Azərbaycanda qurban kəsim platforması.",
    locale: "az_AZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeatBox",
    description:
      "MeatBox ilə qurbanınızı onlayn sifariş edin. Etibarlı, halal və sürətli xidmət.",
  },
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
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Manrope:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <OrderProvider>
            <LanguageProvider>
              <NotificationProvider>
                <ClientShell>{children}</ClientShell>
                <VersionChecker />
              </NotificationProvider>
            </LanguageProvider>
          </OrderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
