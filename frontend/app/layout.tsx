import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import ChatbotProvider from '@/components/chatbot/chatbot-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LifeDecoder - Life Skills Platform',
  description: 'Your life manual for everything school never taught you. Master adulting with AI coaching, simulations, and personalized learning.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/logo.png', sizes: '32x32', type: 'image/png' }],
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body className="font-sans antialiased m-0 p-0 overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <ChatbotProvider />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
