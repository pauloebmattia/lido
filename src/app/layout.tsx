import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: '%s | Lido',
    default: 'Lido - Sua Estante Social',
  },
  description: "Descubra, organize e compartilhe suas leituras com amigos. Uma plataforma social feita para amantes de livros.",
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Lido',
    images: ['/images/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@lidoapp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${playfair.variable} ${jakarta.variable} font-sans antialiased bg-paper text-ink`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
