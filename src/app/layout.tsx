import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const mono = JetBrains_Mono({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Goal Dashboard',
  description: 'Real-time revenue tracking dashboard',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={mono.variable}>
      <body className="bg-black text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
