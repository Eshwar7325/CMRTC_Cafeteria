'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function StudentLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Query the User table directly
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Invalid email or password');
      }

      // Store user data in localStorage
      localStorage.setItem('sessionId', data.roll_no);
      localStorage.setItem('userId', data.roll_no);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userRole', 'STUDENT');

      // Show success toast
      toast.success(`Welcome back, ${data.name}!`);

      // Wait for 1.5 seconds before redirecting to show the toast
      setTimeout(() => {
        window.location.href = '/menu';
      }, 1500);
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      toast.error(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image src="/student-logo.jpeg" alt="Student" width={100} height={100} className="mx-auto rounded-full" />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Student Login</h2>
          <p className="mt-2 text-sm text-gray-400">Access your student account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-t-md w-full px-4 py-3 border border-gray-700 text-white bg-gray-800 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-b-md w-full px-4 py-3 border border-gray-700 text-white bg-gray-800 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="invert-img absolute right-3 top-3 opacity-50 hover:opacity-70"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                tabIndex="0"
              >
                <Image src={isPasswordVisible ? '/eyecross.png' : '/eye.png'} width={24} height={24} alt="Toggle password visibility" />
              </button>
            </div>
          </div>

          {/* <div className="flex justify-between items-center text-sm text-gray-400">
            <Link href="/forgot-password" className="hover:text-purple-400">Forgot password?</Link>
          </div> */}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : 'Login'}
          </button>

          <div className="text-center">
            <Link href="/student/register" className="text-sm text-purple-400 hover:text-purple-300">
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
