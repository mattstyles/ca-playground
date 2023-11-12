import type {Metadata} from 'next'

import {Inter} from 'next/font/google'
import cx from 'clsx'

import './reset.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'CA/GA Playground',
  description: 'Experiments with cellular automaton and genetic algorithms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang='en'>
      <body className={cx(inter.className, inter.variable)}>{children}</body>
    </html>
  )
}
