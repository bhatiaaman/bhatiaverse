import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Bhatiaverse - A Universe of Ideas',
  description: 'Articles, musings, and interactive AI experiences by Amandeep Bhatia',
}

const envLabel = process.env.NEXT_PUBLIC_ENV_LABEL

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <footer
          style={{
            padding: '1rem',
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb',
            marginTop: '2rem',
          }}
        >
          {envLabel && (
            <span
              style={{
                backgroundColor: envLabel === 'Staging' ? '#facc15' : '#22c55e',
                color: '#000',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              {envLabel} Environment
            </span>
          )}
        </footer>
      </body>
    </html>
  )
}