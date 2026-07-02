import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import "./globals.css"

export const metadata: Metadata = {
  title: "Employee Payroll Management",
  description: "Boshliq ishchilarning oyliklarini monitoring qilish tizimi",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
