import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Marketplace | Discover Local Services",
  description: "Browse merchants, book services, make reservations, and manage your orders — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
            data-options={JSON.stringify(
              { activationMode: "toggle", allowActivationInsideInput: true, maxContextLines: 3 }
            )}
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/mcp/dist/client.global.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${dmSans.variable} ${bricolage.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
