import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import SessionWrapper from '@/components/SessionWrapper';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from './userContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CMRTC Cafeteria',
  description: 'College-based food ordering system for CMR students',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} dark:bg-gray-900 dark:text-white min-h-screen`}>
        <SessionWrapper>
          <UserProvider>
            <ThemeProvider>
              <Navbar />
              <main className="transition-colors duration-300">{children}</main>
              <Toaster
                position="top-center"
                autoClose={3000}
                hideProgressBar={true}
                pauseOnFocusLoss={true}
                pauseOnHover={true}
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#1F2937',
                    color: '#fff',
                    border: '2px solid #4B5563',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </ThemeProvider>
          </UserProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
