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
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://showmyfit.com'),
    title: {
        default: 'ShowMyFit | Shop fashion from nearby stores',
        template: '%s | ShowMyFit',
    },
    description: 'ShowMyFit is a quick-commerce fashion marketplace. Find in-stock clothes from nearby stores, add to cart, and get local delivery.',
    keywords: 'ShowMyFit, ShowMyFIT, Showmyfit, nearby store, local fashion, quick commerce, shop nearby stores, clothes delivery India',
    authors: [{ name: 'ShowMyFit' }],
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    verification: {
        google:
            process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
            'pUY5GLg_TuI9mL85fSDPsuk3Fm-s9QxKEDyirrWtMWQ',
    },
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        url: 'https://showmyfit.com/',
        title: 'ShowMyFit | Shop fashion from nearby stores',
        description: 'Find in-stock fashion from nearby stores and get local delivery on ShowMyFit.',
        images: [
            {
                url: '/logo.jpg',
                width: 1200,
                height: 630,
            }
        ],
        siteName: 'ShowMyFit',
        locale: 'en_IN',
    },
    twitter: {
        card: 'summary_large_image',
        site: '@showmyfit',
        creator: '@showmyfit',
        title: 'ShowMyFit | Shop fashion from nearby stores',
        description: 'Find in-stock fashion from nearby stores and get local delivery on ShowMyFit.',
        images: ['/logo.jpg'],
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
                            "name": "ShowMyFit",
                            "alternateName": ["ShowMyFIT", "Showmyfit"],
                            "description": "Quick-commerce fashion marketplace for nearby stores",
                            "url": "https://showmyfit.com",
                            "logo": "https://showmyfit.com/logo.jpg",
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "email": "showmyfitapp@gmail.com",
                                "contactType": "customer service"
                            }
                        })
                    }}
                />
                <Script
                    id="ld-json-website"
                    type="application/ld+json"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "name": "ShowMyFit",
                            "url": "https://showmyfit.com",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": "https://showmyfit.com/search?q={search_term_string}",
                                "query-input": "required name=search_term_string"
                            }
                        })
                    }}
                />
            </head>
            <body className={inter.className} suppressHydrationWarning>
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
