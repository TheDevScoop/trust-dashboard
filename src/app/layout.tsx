import type { Metadata, Viewport } from "next";
import "./globals.css";

const interFallback = {
  className: "font-sans",
};

const siteTitle = "elizaOS Ecosystem Graph";
const siteDescription =
  "Interactive force-directed visualization of the elizaOS ecosystem -- repos, plugins, and projects mapped by coupling strength.";
const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%2306060b'/><circle cx='32' cy='32' r='12' fill='none' stroke='%2322d3ee' stroke-width='2'/><circle cx='32' cy='32' r='4' fill='%2322d3ee'/><circle cx='32' cy='32' r='22' fill='none' stroke='%233b82f6' stroke-width='1' opacity='0.5'/><circle cx='32' cy='32' r='28' fill='none' stroke='%23a78bfa' stroke-width='0.5' opacity='0.3'/></svg>`;

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
  themeColor: "#06060b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${interFallback.className}`}>
      <body className="min-h-screen antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
