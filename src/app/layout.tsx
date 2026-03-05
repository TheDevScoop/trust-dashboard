import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

const siteTitle = "ELIZA // Universal Cartography";
const siteDescription =
  "Navigating the elizaOS cosmos - an interactive stellar map of repositories, plugins, and systems across the AI agent universe.";
const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='8' fill='%23020408'/><circle cx='32' cy='32' r='8' fill='%23fef08a'/><circle cx='32' cy='32' r='16' fill='none' stroke='%2338bdf8' stroke-width='1' opacity='0.6'/><circle cx='32' cy='32' r='24' fill='none' stroke='%23c084fc' stroke-width='0.5' opacity='0.4'/></svg>`;

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
  },
  icons: {
    icon: `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`,
  },
};

export const viewport: Viewport = {
  themeColor: "#020408",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased overflow-hidden font-sans">
        <div className="starfield" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
