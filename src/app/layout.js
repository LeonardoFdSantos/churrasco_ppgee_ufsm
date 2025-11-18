// src/app/layout.js
import './globals.css'

export const metadata = {
  title: 'Dashboard Financeiro',
  description: 'Painel de controle financeiro',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="bg-slate-50">
        {children}
      </body>
    </html>
  )
}