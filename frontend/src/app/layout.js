import { Inter } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import GlobalAlert from "../components/ui/GlobalAlert";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: "Billify CRM",
  description: "Advanced CRM module for the Billify Ecosystem",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <GlobalAlert />
        </AuthProvider>
      </body>
    </html>
  );
}
