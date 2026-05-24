import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'HONGCHA — OTT 콘텐츠 추천',
  description: '넷플릭스, 티빙, 디즈니+, 웨이브 콘텐츠를 취향에 맞게 추천해드립니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} dark`}>
      <body className="bg-zinc-950 text-white antialiased">{children}</body>
    </html>
  )
}
