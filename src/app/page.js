'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-2 sm:p-4">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2 sm:mb-4">Welcome to CMRTC Cafeteria</h1>
        <p className="text-gray-300 text-base sm:text-lg">Choose your role to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl w-full px-2 sm:px-4">
        {/* Student Card */}
        <button
          onClick={() => router.push('/student/login')}
          className="group relative bg-gray-800 rounded-xl p-4 sm:p-6 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="aspect-square relative mb-3 sm:mb-4 overflow-hidden rounded-lg">
            <Image
              src="/student-logo.jpeg"
              alt="Student"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-purple-400 mb-1 sm:mb-2">Student</h2>
          <p className="text-sm sm:text-base text-gray-400">
            Order food, track your orders, and manage your account
          </p>
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>
        </button>

        {/* Admin Card */}
        <button
          onClick={() => router.push('/admin/login')}
          className="group relative bg-gray-800 rounded-xl p-4 sm:p-6 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="aspect-square relative mb-3 sm:mb-4 overflow-hidden rounded-lg">
            <Image
              src="/admin-logo.webp"
              alt="Admin"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-purple-400 mb-1 sm:mb-2">Stall Admin</h2>
          <p className="text-sm sm:text-base text-gray-400">
            Manage your stall, orders, and inventory
          </p>
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
