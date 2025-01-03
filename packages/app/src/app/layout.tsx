import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { APP_NAME } from '@/config/site';
import { DAppProvider } from '@/providers/dapp-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  adjustFontFallback: false
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
  adjustFontFallback: false
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_NAME
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} font-sans antialiased`}
      >
        <DAppProvider>
          <Toaster
            toastOptions={{
              className:
                'font-sans antialiased !max-w-full md:!max-w-[500px] text-xs overflow-auto',
              duration: 3_000
            }}
          />
          <TooltipProvider delayDuration={300}>
            <div className="flex min-h-dvh w-screen flex-col">
              <header className="h-[var(--header-height)]">
                <Header />
              </header>
              <main className="flex-1">{children}</main>
              <footer className="h-[var(--footer-height)]">
                <Footer />
              </footer>
            </div>

            <ToastContainer />
          </TooltipProvider>
        </DAppProvider>
      </body>
    </html>
  );
}
