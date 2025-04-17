'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function StudentRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    roll_no: '',
    name: '',
    email: '',
    phone: '',
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
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('User')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Check if roll number already exists
      const { data: existingRollNo, error: rollNoError } = await supabase
        .from('User')
        .select('roll_no')
        .eq('roll_no', formData.roll_no)
        .single();

      if (existingRollNo) {
        throw new Error('Roll number already registered');
      }

      // Insert new user
      const { data, error } = await supabase
        .from('User')
        .insert([{
          roll_no: formData.roll_no,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Store user data in localStorage
      localStorage.setItem('sessionId', data.roll_no);
      localStorage.setItem('userId', data.roll_no);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userRole', 'STUDENT');

      // Show success toast
      toast.success(`Welcome to CMRTC Cafeteria, ${data.name}!`);

      // Wait for 1.5 seconds before redirecting to show the toast
      setTimeout(() => {
        window.location.href = '/menu';
      }, 1500);
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
      toast.error(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image src="/student-logo.jpeg" alt="Student" width={100} height={100} className="mx-auto rounded-full" />
          <h2 className="mt-6 text-3xl font-extrabold text-white">Student Registration</h2>
          <p className="mt-2 text-sm text-gray-400">Create your student account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="roll_no" className="sr-only">Roll Number</label>
              <input
                id="roll_no"
                name="roll_no"
                type="text"
                required
                value={formData.roll_no}
                onChange={handleChange}
                className="appearance-none rounded-t-md w-full px-4 py-3 border border-gray-700 text-white bg-gray-800 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Roll Number"
              />
            </div>
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none w-full px-4 py-3 border border-gray-700 text-white bg-gray-800 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Full Name"
              />
            </div>
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
                className="appearance-none w-full px-4 py-3 border border-gray-700 text-white bg-gray-800 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="appearance-none w-full px-4 py-3 border border-gray-700 text-white bg-gray-800 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Phone Number"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="new-password"
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
                Registering...
              </span>
            ) : (
              'Register'
            )}
          </button>

          <div className="text-center">
            <Link href="/student/login" className="text-sm text-purple-400 hover:text-purple-300">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}