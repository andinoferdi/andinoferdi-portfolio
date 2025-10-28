import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Andino Ferdiansah - Full Stack Developer',
    template: '%s | Andino Ferdiansah'
  },
  description: 'Portfolio of Andino Ferdiansah - Full Stack Developer specializing in React, Next.js, Vue.js, Laravel, and modern web technologies.',
  keywords: [
    'Andino Ferdiansah',
    'Full Stack Developer',
    'React Developer',
    'Next.js Developer',
    'Vue.js Developer',
    'Laravel Developer',
    'TypeScript',
    'JavaScript',
    'Portfolio',
    'Web Development'
  ],
  authors: [{ name: 'Andino Ferdiansah' }],
  creator: 'Andino Ferdiansah',
  publisher: 'Andino Ferdiansah',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://andinoferdi-portfolio.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://andinoferdi-portfolio.vercel.app',
    title: 'Andino Ferdiansah - Full Stack Developer',
    description: 'Portfolio of Andino Ferdiansah - Full Stack Developer specializing in React, Next.js, Vue.js, Laravel, and modern web technologies.',
    siteName: 'Andino Ferdiansah Portfolio',
    images: [
      {
        url: '/images/self/1.jpg',
        width: 1200,
        height: 630,
        alt: 'Andino Ferdiansah - Full Stack Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andino Ferdiansah - Full Stack Developer',
    description: 'Portfolio of Andino Ferdiansah - Full Stack Developer specializing in React, Next.js, Vue.js, Laravel, and modern web technologies.',
    images: ['/images/self/1.jpg'],
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
    google: 'your-google-verification-code',
  },
};

// Preload links for critical images
export const preloadLinks = [
  {
    rel: 'preload',
    href: '/images/self/1.jpg',
    as: 'image',
    type: 'image/jpeg',
  },
  {
    rel: 'preload',
    href: '/images/self/2.jpg',
    as: 'image',
    type: 'image/jpeg',
  },
  {
    rel: 'preload',
    href: '/images/self/3.jpg',
    as: 'image',
    type: 'image/jpeg',
  },
  {
    rel: 'preload',
    href: '/images/self/4.jpg',
    as: 'image',
    type: 'image/jpeg',
  },
  {
    rel: 'preload',
    href: '/images/gallery/34.jpg',
    as: 'image',
    type: 'image/jpeg',
  },
  {
    rel: 'preload',
    href: '/images/projects/FreshKo.png',
    as: 'image',
    type: 'image/png',
  },
  {
    rel: 'preload',
    href: '/images/projects/portfolio-v2.png',
    as: 'image',
    type: 'image/png',
  },
  {
    rel: 'preload',
    href: '/images/projects/anro.png',
    as: 'image',
    type: 'image/png',
  },
  {
    rel: 'dns-prefetch',
    href: 'https://openrouter.ai',
  },
];
