import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "CampusFlow - Coventry University Student Assistant",
    template: "%s | CampusFlow"
  },
  description: "Get instant help with Coventry University services, accommodation, fees, courses, and student support. AI-powered assistant for all your university needs.",
  keywords: [
    "Coventry University",
    "student support",
    "university assistant",
    "accommodation",
    "fees",
    "courses",
    "student services",
    "campus help",
    "university guide"
  ],
  authors: [{ name: "CampusFlow Team" }],
  creator: "CampusFlow",
  publisher: "Coventry University",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://campusflow.coventry.ac.uk'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://campusflow.coventry.ac.uk',
    title: 'CampusFlow - Coventry University Student Assistant',
    description: 'Get instant help with Coventry University services, accommodation, fees, courses, and student support.',
    siteName: 'CampusFlow',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CampusFlow - Coventry University Student Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusFlow - Coventry University Student Assistant',
    description: 'Get instant help with Coventry University services, accommodation, fees, courses, and student support.',
    images: ['/og-image.jpg'],
    creator: '@CoventryUni',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CampusFlow",
              "description": "AI-powered student assistant for Coventry University",
              "url": "https://campusflow.coventry.ac.uk",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "category": "Student Support Services"
              },
              "provider": {
                "@type": "EducationalOrganization",
                "name": "Coventry University",
                "url": "https://www.coventry.ac.uk"
              },
              "featureList": [
                "Accommodation Support",
                "Fees & Finance Help",
                "Course Information",
                "Student Services",
                "Career Planning"
              ]
            })
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
