'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function StudentNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    const userName = localStorage.getItem('userName');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    
    toast.success(`Goodbye, ${userName}! Come back soon!`);
    setTimeout(() => {
      window.location.href = '/'; // This will force a full page reload and show the basic navbar
    }, 2000);
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between sm:h-16">
          <div className="flex justify-between sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex items-center justify-center">
                  <img className='w-10 h-10 sm:w-14 sm:h-14 rounded-full p-2' src="https://media-hosting.imagekit.io//54e3f9080cac4431/images.png?Expires=1833774695&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=VB60js03kqePpLnT3dMH4e7OgppubyPrlBBeCTJfe3w9gKMEO3R6y5CqgdrIJ-G1QfTs2GDQtbMSpH7f0j7i3iZeRCG5aG7gdeOUEGZ5zEtZ7dT3WwiZdvUStk1P5GHUFF3Fr9Rz6WGSyK2-7QYdsDJokQD4yJIsdzXCOxPiuM93SkHPNdpwc4xfY08RYnoicsz1guGf-V-piIHF3vGzd58qCk05FDRxEk6MFvFvwicBdvIcS02wDWuq3-SY4opmjX8x9fCLVChlkoEhHLHEsrPVjqidOkvSr5k7DzkAdbDVmp6BaH7AntiATZzRIUXVI3px4RMFGXsKwy9cx45WEg__" alt="CMR" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-purple-400 hover:text-purple-300">
                  CMRTC Cafeteria
                </span>
              </Link>
            </div>
            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/menu"
                className={`${
                  isActive('/menu')
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-gray-300 hover:text-purple-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Menu
              </Link>
              <Link
                href="/track-order"
                className={`${
                  isActive('/track-order')
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-gray-300 hover:text-purple-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Track Order
              </Link>
              <Link
                href="/orders"
                className={`${
                  isActive('/orders')
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-gray-300 hover:text-purple-300'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                My Orders
              </Link>
            </div>
            
          </div>
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center ml-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                /* Icon when menu is open */
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Mobile menu */}
          {isOpen && (
            <div className="sm:hidden absolute top-16 right-4 w-fit bg-gray-800 z-10 shadow-lg">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="/menu"
                  className={`${
                    isActive('/menu')
                      ? 'bg-gray-700 text-purple-400'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-purple-300'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                >
                  Menu
                </Link>
                <Link
                  href="/track-order"
                  className={`${
                    isActive('/track-order')
                      ? 'bg-gray-700 text-purple-400'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-purple-300'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                >
                  Track Order
                </Link>
                <Link
                  href="/orders"
                  className={`${
                    isActive('/orders')
                      ? 'bg-gray-700 text-purple-400'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-purple-300'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                >
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-purple-300 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
          <div className="hidden sm:flex items-center">
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