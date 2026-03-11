import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const mono = JetBrains_Mono({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Goal Dashboard',
  description: 'Real-time revenue tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={mono.variable}>
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
