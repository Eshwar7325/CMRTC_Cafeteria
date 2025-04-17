'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Script from 'next/script';

// Razorpay credentials
const RAZORPAY_KEY_ID = 'rzp_test_c7G4chBa5Iqwf6';

export default function Payment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cartData, setCartData] = useState(null);
  const [orderTokens, setOrderTokens] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  
  // Category-specific counters starting at 1
  const categoryCounters = useRef({
    can: 1, // Canteen counter starts at 1
    fry: 501, // Fries counter starts at 501
    san: 801  // Sandwich counter starts at 801
  });

  // Load counters from localStorage on component mount
  useEffect(() => {
    // Try to load saved counters from localStorage
    const savedCounters = localStorage.getItem('categoryCounters');
    if (savedCounters) {
      try {
        const parsed = JSON.parse(savedCounters);
        categoryCounters.current = { ...categoryCounters.current, ...parsed };
        console.log('Loaded counters from localStorage:', categoryCounters.current);
      } catch (err) {
        console.error('Error parsing saved counters:', err);
      }
    }
  }, []);

  // Function to save counters to localStorage
  const saveCounters = () => {
    localStorage.setItem('categoryCounters', JSON.stringify(categoryCounters.current));
    console.log('Saved counters to localStorage:', categoryCounters.current);
  };

  useEffect(() => {
    // Check if Razorpay is loaded
    if (window.Razorpay) {
      setRazorpayReady(true);
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      router.push('/student/login');
      return;
    }

    // Get and parse cart data
    const cartParam = searchParams.get('cart');
    if (!cartParam) {
      router.push('/menu');
      return;
    }

    try {
      const parsedCart = JSON.parse(decodeURIComponent(cartParam));
      // Structure the cart data properly
      const cartData = {
        items: parsedCart,
        total: parsedCart.reduce((total, item) => total + (item.price * item.quantity), 0)
      };
      setCartData(cartData);
    } catch (err) {
      console.error('Error parsing cart data:', err);
      setError('Invalid cart data');
    }
  }, [searchParams, router]);

  // Create orders in database but with 'payment_pending' status
  const createOrders = async () => {
    try {
      // Get the current date
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we need to reset counters for today
      const lastResetDate = localStorage.getItem('lastResetDate');
      if (lastResetDate !== today) {
        // Delete all orders from the database
        const { error: deleteError } = await supabase
          .from('Orders')
          .delete()
          .neq('token_id', 0); // Delete all orders

        if (deleteError) {
          console.error('Error deleting orders:', deleteError);
          throw new Error('Failed to reset orders for the new day');
        }

        // Reset counters for the new day
        categoryCounters.current = {
          can: 1,
          fry: 501,
          san: 801
        };
        localStorage.setItem('lastResetDate', today);
        saveCounters();
      }

      if (!cartData || !cartData.items) {
        throw new Error('No cart data available');
      }

      // Get user data
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      if (!userId || !userName) {
        throw new Error('User data not found. Please login again.');
      }

      // Group items by category
      const itemsByCategory = cartData.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {
            items: [],
            total: 0
          };
        }
        acc[item.category].items.push(item);
        acc[item.category].total += item.price * item.quantity;
        return acc;
      }, {});

      // Create separate orders for each category
      const orders = [];
      const tokens = {};
      
      for (const [category, categoryData] of Object.entries(itemsByCategory)) {
        // Get the current counter for this category
        const currentCounter = categoryCounters.current[category];
        
        // Create a numeric token_id that's unique across categories
        const categoryBase = {
          can: 1,  // Canteen orders start at 1
          fry: 500,  // Fries orders start at 500
          san: 800   // Sandwich orders start at 800
        };
        
        const categoryPrefix = category.substring(0, 3).toUpperCase();
        const displayToken = `${categoryPrefix}${currentCounter.toString().padStart(3, '0')}`;
        
        console.log(`Creating order with token ${displayToken} for ${category}`);
        
        // Increment the counter for this category
        categoryCounters.current[category] = currentCounter + 1;
        
        // Save updated counters
        saveCounters();
        
        // Apply the correct base based on category
        let tokenId;
        if (category === 'can') {
          tokenId = currentCounter; // For canteen, just use the counter
        } else if (category === 'fry') {
          tokenId = currentCounter; // For fries, base 500 + digits
        } else if (category === 'san') {
          tokenId = currentCounter; // For sandwich, base 800 + digits
        }

        console.log(`Order token_id will be ${tokenId} for ${displayToken}`);

        const order = {
          user_id: userId,
          token_id: tokenId, // Use numeric ID based on display token
          display_token: displayToken, // Store formatted token for display
          user_name: userName,
          items: categoryData.items,
          total: categoryData.total,
          status: 'payment_pending', // Mark as payment_pending initially
          category: category,
          created_at: new Date().toISOString()
        };

        console.log('Creating order:', order);

        // Insert order into Supabase
        const { data, error } = await supabase
          .from('Orders')
          .insert([order])
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Failed to create order: ${error.message}`);
        }

        if (!data) {
          throw new Error('No data returned from order creation');
        }

        // Store the token_id for this category
        tokens[category] = {
          id: data.token_id, // Use the numeric token_id
          display: data.display_token || `${category.toUpperCase()}-${currentCounter}` // formatted display token
        };
        orders.push(data);
      }

      return { orders, tokens };
    } catch (error) {
      console.error('Error creating orders:', error);
      throw error;
    }
  };

  // Update orders after successful payment
  const updateOrdersAfterPayment = async (tokens) => {
    try {
      // Update all orders to 'pending' status
      for (const categoryTokens of Object.values(tokens)) {
        const tokenId = categoryTokens.id; // Use the numeric ID
        const { error } = await supabase
          .from('Orders')
          .update({ status: 'pending' })
          .eq('token_id', tokenId);
        
        if (error) {
          console.error('Error updating order status:', error);
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Initialize Razorpay payment
  const openRazorpayCheckout = (orders, tokens) => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: cartData.total * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: 'INR',
      name: 'Cafeteria',
      description: 'Food Order Payment',
      image: 'https://i.imgur.com/3g7nmJC.png', // Replace with your logo
      order_id: paymentData?.id, // This will be received after creating order on server
      prefill: {
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        contact: localStorage.getItem('userPhone') || '',
      },
      theme: {
        color: '#9333ea', // Purple color to match your theme
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
          console.log('Payment canceled by user');
        },
      },
      handler: function(response) {
        // Handle successful payment
        console.log('Payment successful:', response);
        
        // Update orders to pending status - this is the key fix
        // Create a new async function and call it immediately
        (async function() {
          try {
            console.log('Attempting to update order statuses for tokens:', tokens);
            
            // Update all orders to 'pending' status one by one
            for (const categoryTokens of Object.values(tokens)) {
              console.log(`Updating status for order ${categoryTokens.id}`);
              
              const { data, error } = await supabase
                .from('Orders')
                .update({ status: 'pending' })
                .eq('token_id', categoryTokens.id)
                .select();
              
              if (error) {
                console.error(`Error updating order ${categoryTokens.id}:`, error);
              } else {
                console.log(`Successfully updated order ${categoryTokens.id}:`, data);
              }
            }

            // Only clear the cart after successful payment and order status updates
            localStorage.removeItem('cart');
            setOrderTokens(tokens);
            
            toast.success('Payment successful! Order placed.');
            
            // Redirect to track order
            setTimeout(() => {
              // Get the first order's token_id for tracking
              const firstCategory = Object.keys(tokens)[0];
              const firstToken = tokens[firstCategory].id; // Use the numeric ID
              router.push(`/track-order?token_id=${firstToken}`);
            }, 3000);
          } catch (err) {
            console.error('Error updating orders after payment:', err);
            toast.error('Payment successful but there was an error updating the order status.');
          }
        })();
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Error opening Razorpay:', err);
      setError('Failed to open payment window. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle server-side payment order creation
  const createPaymentOrder = async () => {
    try {
      // In a real implementation, you'd create the order on the server side
      // to avoid exposing your Razorpay secret key
      
      // For demo purposes, we'll just simulate a successful order creation
      // In production, you should create a server API endpoint for this
      const demoOrderId = 'order_' + Date.now();
      
      setPaymentData({
        id: demoOrderId,
        amount: cartData.total * 100,
      });
      
      return demoOrderId;
    } catch (err) {
      console.error('Error creating payment order:', err);
      throw new Error('Failed to initialize payment. Please try again.');
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setError('');

      if (!cartData) {
        throw new Error('No cart data available');
      }

      if (!window.Razorpay) {
        throw new Error('Payment gateway not loaded. Please refresh the page.');
      }

      // First create the orders in the database
      const { orders, tokens } = await createOrders();
      
      // Then create the Razorpay order
      await createPaymentOrder();
      
      // Open the Razorpay payment window
      openRazorpayCheckout(orders, tokens);
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!cartData) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Group items by category for display
  const itemsByCategory = cartData.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        items: [],
        total: 0
      };
    }
    acc[item.category].items.push(item);
    acc[item.category].total += item.price * item.quantity;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayReady(true)}
        onError={() => {
          console.error('Failed to load Razorpay SDK');
          setError('Payment gateway could not be loaded. Please refresh the page.');
        }}
      />
      
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white">
            Complete Your Payment
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Your orders will be processed once the payment is complete
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {orderTokens && (
          <div className="mb-6 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded">
            <h3 className="text-lg font-semibold mb-2">Order Tokens</h3>
            {Object.entries(orderTokens).map(([category, categoryTokens]) => (
              <div key={category} className="flex justify-between items-center mb-2">
                <span>
                  {category === 'can' ? 'Canteen' :
                   category === 'fry' ? 'Fries' :
                   category === 'san' ? 'Sandwich' :
                   category.charAt(0).toUpperCase() + category.slice(1)}:
                </span>
                <span className="font-mono text-xl font-bold">{categoryTokens.display}</span>
              </div>
            ))}
            <p className="text-sm mt-4">Please save these token numbers. You'll need them to collect your orders.</p>
          </div>
        )}

        <div className="bg-gray-800 shadow rounded-lg p-6 mb-6 border border-gray-700">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Order Summary</h3>
            {Object.entries(itemsByCategory).map(([category, categoryData], index) => (
              <div key={category} className={index > 0 ? 'mt-6 pt-6 border-t border-gray-700' : ''}>
                <h4 className="text-sm font-medium text-purple-400 mb-3">
                  {category === 'can' ? 'Canteen' :
                   category === 'fry' ? 'Fries' :
                   category === 'san' ? 'Sandwich' :
                   category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
                <div className="space-y-2">
                  {categoryData.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-400">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-300">Category Total</span>
                      <span className="font-medium text-purple-400">
                        ₹{categoryData.total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex justify-between">
                <span className="font-medium text-white">Grand Total</span>
                <span className="font-medium text-purple-400">
                  ₹{cartData.total}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing || !razorpayReady}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : !razorpayReady ? (
              'Loading Payment Gateway...'
            ) : (
              'Pay Now'
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              // Get the current cart data from localStorage
              const savedCart = localStorage.getItem('cart');
              if (savedCart) {
                // Navigate back to menu with the saved cart data
                router.push(`/menu?cart=${encodeURIComponent(savedCart)}`);
              } else {
                router.push('/menu');
              }
            }}
            className="text-sm text-gray-400 hover:text-purple-400"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
} 