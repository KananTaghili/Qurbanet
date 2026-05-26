import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { OrderProvider } from "../context/OrderContext";
import { LanguageProvider } from "../context/LanguageContext";
import ClientShell from "../components/ClientShell";

const BASE_URL = "https://qurbanet.az";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: "QurbanEt — Etibarli · Halal · Sürətli",
  description:
    "QurbanEt ilə qurbanınızı onlayn sifariş edin. Etibarlı, halal və sürətli xidmət. Azərbaycanda qurban kəsim platforması.",
  keywords: ["qurban", "qurbanet", "qurban kes", "halal", "azerbaycan"],
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "QurbanEt",
    title: "QurbanEt — Etibarli · Halal · Sürətli",
    description:
      "QurbanEt ilə qurbanınızı onlayn sifariş edin. Etibarlı, halal və sürətli xidmət. Azərbaycanda qurban kəsim platforması.",
    locale: "az_AZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "QurbanEt — Etibarli · Halal · Sürətli",
    description:
      "QurbanEt ilə qurbanınızı onlayn sifariş edin. Etibarlı, halal və sürətli xidmət.",
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
