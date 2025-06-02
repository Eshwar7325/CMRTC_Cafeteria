'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const category = localStorage.getItem('adminCategory');
    if (category) {
      // Get category name from Categories table
      const getCategoryName = async () => {
        const { data, error } = await supabase
          .from('Categories')
          .select('name')
          .eq('slug', category)
          .single();

        if (data) {
          setCategoryName(data.name);
        }
      };
      getCategoryName();
    }
  }, []);

  const handleLogout = () => {
    const userName = localStorage.getItem('userName');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminCategory');
    
    toast.success(`Goodbye, ${userName}! Come back soon!`);
    setTimeout(() => {
      window.location.href = '/'; // This will force a full page reload and show the basic navbar
    }, 2000);
  };

  const isActive = (path) => pathname === path;
  const [isTotalOrdersActive, setIsTotalOrdersActive] = useState(false);

  useEffect(() => {
    setIsTotalOrdersActive(pathname === '/admin/Total-Orders');
  }, [pathname]);

  return (
    <nav className="bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <div className="flex items-center justify-center">
                  <img className='w-10 h-10 sm:w-14 sm:h-14 rounded-full p-2' src="https://media-hosting.imagekit.io//54e3f9080cac4431/images.png?Expires=1833774695&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=VB60js03kqePpLnT3dMH4e7OgppubyPrlBBeCTJfe3w9gKMEO3R6y5CqgdrIJ-G1QfTs2GDQtbMSpH7f0j7i3iZeRCG5aG7gdeOUEGZ5zEtZ7dT3WwiZdvUStk1P5GHUFF3Fr9Rz6WGSyK2-7QYdsDJokQD4yJIsdzXCOxPiuM93SkHPNdpwc4xfY08RYnoicsz1guGf-V-piIHF3vGzd58qCk05FDRxEk6MFvFvwicBdvIcS02wDWuq3-SY4opmjX8x9fCLVChlkoEhHLHEsrPVjqidOkvSr5k7DzkAdbDVmp6BaH7AntiATZzRIUXVI3px4RMFGXsKwy9cx45WEg__" alt="CMR" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-purple-400 hover:text-purple-300">
                  CMRTC Cafeteria
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/admin/dashboard"
                className={`${
                  isActive('/admin/dashboard')
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-gray-300 hover:text-purple-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/Total-Orders"
                className={`${
                  isTotalOrdersActive
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-gray-300 hover:text-purple-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Total Orders
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-purple-300 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}