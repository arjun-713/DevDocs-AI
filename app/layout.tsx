import "./globals.css"
import { ReactNode } from "react"

export const metadata = {
  title: "DevDocs AI | Talk to any codebase",
  description: "Chat with any GitHub repo. Instantly. Paste a URL, get answers with cited sources.",
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
