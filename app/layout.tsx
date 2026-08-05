import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#9333EA',
};

export const metadata: Metadata = {
    title: 'ShowMyFIT - Nearby Store | Shop from Nearby Stores Online',
    description: 'Discover and shop from amazing nearby stores in your area. ShowMyFIT connects you with nearby businesses offering fashion, electronics, home goods, and more. Support your community while finding great deals!',
    keywords: 'nearby store, online shopping, nearby stores, community shopping, fashion, electronics, home goods, local business, ShowMyFIT, store finder',
    authors: [{ name: 'ShowMyFIT' }],
    robots: 'index, follow',
    alternates: {
        canonical: 'https://showmyfit.com/',
    },
    openGraph: {
        type: 'website',
        url: 'https://showmyfit.com/',
        title: 'ShowMyFIT - Nearby Store | Shop from Nearby Stores Online',
        description: 'Discover and shop from amazing nearby stores in your area. ShowMyFIT connects you with nearby businesses offering fashion, electronics, home goods, and more.',
        images: [
            {
                url: 'https://showmyfit.com/og-image.jpg',
                width: 1200,
                height: 630,
            }
        ],
        siteName: 'ShowMyFIT',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        site: '@showmyfit',
        creator: '@showmyfit',
        title: 'ShowMyFIT - Nearby Store | Shop from Nearby Stores Online',
        description: 'Discover and shop from amazing nearby stores in your area. ShowMyFIT connects you with nearby businesses offering fashion, electronics, home goods, and more.',
        images: ['https://showmyfit.com/twitter-image.jpg'],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://images.unsplash.com" />
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                  <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
                ) : null}
                <link rel="shortcut icon" type="image/jpeg" href="/logo.jpg" />
                <Script
                    id="ld-json-org"
                    type="application/ld+json"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": "ShowMyFIT",
                            "description": "Nearby store platform connecting customers with amazing nearby stores",
                            "url": "https://showmyfit.com",
                            "logo": "https://showmyfit.com/logo.png",
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "email": "showmyfitapp@gmail.com",
                                "contactType": "customer service"
                            }
                        })
                    }}
                />
            </head>
            <body className={inter.className} suppressHydrationWarning>
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-XXXXXXXXXX');
                    `}
                </Script>
                <Script
                    src="https://checkout.razorpay.com/v1/checkout.js"
                    strategy="afterInteractive"
                />
                <Providers>
                    <AppLayout>
                        {children}
                    </AppLayout>
                </Providers>
            </body>
        </html >
    );
}
