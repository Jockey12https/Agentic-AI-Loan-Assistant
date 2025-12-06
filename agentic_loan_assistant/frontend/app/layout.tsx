import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LoanBot AI Assistant - Intelligent Loan Management',
  description: 'AI-powered loan assistant with voice and text interaction for seamless loan applications',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#667eea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
