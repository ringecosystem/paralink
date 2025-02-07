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

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_NAME,
  icons: [
    {
      url: '/images/favicon/favicon32.png',
      sizes: '32x32',
      type: 'image/png',
      rel: 'icon'
    },
    {
      url: '/images/favicon/favicon48.png',
      sizes: '48x48',
      type: 'image/png',
      rel: 'icon'
    },
    {
      url: '/images/favicon/favicon96.png',
      sizes: '96x96',
      type: 'image/png',
      rel: 'icon'
    },
    {
      url: '/images/favicon/favicon167.png',
      sizes: '167x167',
      type: 'image/png',
      rel: 'apple-touch-icon'
    },
    {
      url: '/images/favicon/favicon180.png',
      sizes: '180x180',
      type: 'image/png',
      rel: 'apple-touch-icon'
    },
    {
      url: '/images/favicon/favicon192.png',
      sizes: '192x192',
      type: 'image/png',
      rel: 'icon'
    },
    {
      url: '/images/favicon/favicon512.png',
      sizes: '512x512',
      type: 'image/png',
      rel: 'icon'
    }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DAppProvider>
          <Toaster
            toastOptions={{
              className:
                'antialiased !max-w-full md:!max-w-[500px] text-xs overflow-auto',
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

            <ToastContainer className="w-auto md:w-[360px]" />
          </TooltipProvider>
        </DAppProvider>
      </body>
    </html>
  );
}
