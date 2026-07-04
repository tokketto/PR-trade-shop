import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parmigiano Reggiano — Trade Partners',
  description: 'Official trade merchandise for authorised partners',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
