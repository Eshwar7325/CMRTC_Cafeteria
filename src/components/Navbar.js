'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentNavbar from './StudentNavbar';
import AdminNavbar from './AdminNavbar';

export default function Navbar() {
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const sessionId = localStorage.getItem('sessionId');
      const storedRole = localStorage.getItem('userRole');
      setUserRole(storedRole);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  if (userRole === 'ADMIN') {
    return <AdminNavbar />;
  } else if (userRole === 'STUDENT') {
    return <StudentNavbar />;
  }

  return (
    <nav className="bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex items-center justify-center">
                  <img className='w-10 h-10 sm:w-14 sm:h-14 rounded-full p-2' src="/logo.png" alt="CMR" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-purple-400 hover:text-purple-300">
                  CMRTC Cafeteria
                </span>
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <Link
              href="/student/login"
              className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Student Login
            </Link>
            <Link
              href="/admin/login"
              className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 