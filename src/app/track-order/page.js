'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const orderStatuses = {
  pending: { label: 'Order Pending', color: 'bg-yellow-900/50 text-yellow-200 border-yellow-700' },
  preparing: { label: 'Preparing', color: 'bg-blue-900/50 text-blue-200 border-blue-700' },
  ready: { label: 'Ready for Pickup', color: 'bg-green-900/50 text-green-200 border-green-700' },
  completed: { label: 'Completed', color: 'bg-gray-900/50 text-gray-200 border-gray-700' },
};

export default function TrackOrder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to get display token
  const getDisplayToken = (tokenId) => {
    if (!tokenId) return '';
    const totalOrders = orders.length; // Since we're tracking a single order, we'll use a fixed value
    if (totalOrders >= 100) {
      return (tokenId % 100) + 100;
    }
    return tokenId % 100;
  };

  useEffect(() => {
    // Check if user is logged in
    const sessionId = localStorage.getItem('sessionId');
    const userId = localStorage.getItem('userId');
    
    if (!sessionId || !userId) {
      router.push('/student/login');
      return;
    }

    // Get token_id from URL params if provided
    const tokenId = searchParams.get('token_id');
    if (tokenId) {
      console.log('Fetching specific order with token:', tokenId);
      fetchSpecificOrder(tokenId);
    } else {
      console.log('Fetching all pending orders for user:', userId);
      fetchUserOrders(userId);
    }

    // Subscribe to order updates
    const channel = supabase
      .channel('order_updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'Orders',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Received order update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Parse the items array if it's a string
            const updatedOrder = {
              ...payload.new,
              items: typeof payload.new.items === 'string' 
                ? JSON.parse(payload.new.items) 
                : payload.new.items
            };
            
            // Log the updated order status to debug
            console.log('Updated order status:', updatedOrder.status);
            
            // Update orders list
            setOrders(prevOrders => {
              // If the order status is 'completed', remove it from current orders
              if (updatedOrder.status === 'completed') {
                console.log('Removing completed order:', updatedOrder.id);
                return prevOrders.filter(o => o.id !== updatedOrder.id);
              }
              
              const existingIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
              if (existingIndex >= 0) {
                const newOrders = [...prevOrders];
                newOrders[existingIndex] = updatedOrder;
                return newOrders;
              }
              return [...prevOrders, updatedOrder];
            });

            // Update selected order if it's the one being updated
            if (selectedOrder && selectedOrder.id === updatedOrder.id) {
              // If the order is completed, clear the selected order
              if (updatedOrder.status === 'completed') {
                setSelectedOrder(null);
                toast.success('Order completed and removed from tracking');
              } else {
                setSelectedOrder(updatedOrder);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, searchParams]);

  const fetchUserOrders = async (userId) => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching orders from Supabase...');
      
      const { data, error } = await supabase
        .from('Orders')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.log('No orders found for user:', userId);
        return;
      }

      // Parse the items array for each order
      const parsedOrders = data.map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      }));

      console.log('Orders fetched successfully:', parsedOrders);
      setOrders(parsedOrders);
      
      // Log current filters for clarity
      console.log('Orders after filtering out completed:', parsedOrders.filter(order => 
        ['pending', 'preparing', 'ready'].includes(order.status)
      ));
      
      // If there's only one order, select it
      if (parsedOrders.length === 1) {
        setSelectedOrder(parsedOrders[0]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpecificOrder = async (tokenId) => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching specific order from Supabase...');
      
      const { data, error } = await supabase
        .from('Orders')
        .select('*')
        .eq('token_id', tokenId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.log('No order found with token:', tokenId);
        setError('Order not found');
        return;
      }

      // Parse the items array if it's a string
      const parsedOrder = {
        ...data,
        items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items
      };

      console.log('Order fetched successfully:', parsedOrder);
      
      // Check if the order is completed - if so, notify the user
      if (parsedOrder.status === 'completed') {
        setError('This order has been completed');
        toast.success('This order has been completed');
        // Still set the orders array but the currentOrders filter will handle display
      }
      
      setSelectedOrder(parsedOrder);
      setOrders([parsedOrder]);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to fetch order details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'can':
        return 'Canteen';
      case 'fry':
        return 'Fries';
      case 'san':
        return 'Sandwich';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const currentOrders = orders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  );

  useEffect(() => {
    // Additional debug logging to check orders state
    console.log('Current filtered orders:', currentOrders);
  }, [currentOrders]);

  const completedOrders = orders.filter(order => 
    order.status === 'completed'
  );

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Track Your Orders</h1>

        {error && (
          <div className="mb-8 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
            <button 
              onClick={() => router.push('/orders')}
              className="mt-2 text-sm underline hover:text-red-100"
            >
              View All Orders
            </button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading orders...</p>
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="space-y-6">
            {/* Orders List */}
            <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Current Orders</h2>
              {currentOrders.length > 0 ? (
                <div className="space-y-4">
                  {currentOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id
                          ? 'border-purple-500 bg-gray-700'
                          : 'border-gray-700 hover:border-purple-500'
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-medium">Order {getDisplayToken(order.token_id)}</h3>
                          <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-purple-400">{getCategoryName(order.category)}</p>
                          <p className="text-white font-medium">₹{order.total}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          orderStatuses[order.status].color
                        }`}>
                          {orderStatuses[order.status].label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">No active orders at the moment</p>
                  <button
                    onClick={() => router.push('/menu')}
                    className="mt-4 text-purple-400 hover:text-purple-300"
                  >
                    Order Food
                  </button>
                </div>
              )}
            </div>

            {/* Selected Order Details */}
            {selectedOrder && (
              <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Order {getDisplayToken(selectedOrder.token_id)}</h2>
                    <p className="text-sm text-gray-400">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-purple-400">{getCategoryName(selectedOrder.category)}</p>
                    <p className="text-lg font-semibold text-purple-400">₹{selectedOrder.total}</p>
                  </div>
                </div>

                {/* Order Status */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                      {Object.keys(orderStatuses).map((status, index) => {
                        const isActive = Object.keys(orderStatuses).indexOf(selectedOrder.status) >= index;
                        return (
                          <div
                            key={status}
                            className={`${
                              isActive ? status === 'completed' ? 'bg-gray-400' : 'bg-purple-400' : 'bg-gray-700'
                            } transition-all duration-500 w-1/4`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between">
                      {Object.keys(orderStatuses).map((status) => (
                        <div
                          key={status}
                          className={`text-xs ${
                            status === selectedOrder.status
                              ? orderStatuses[status].color
                              : 'text-gray-400'
                          }`}
                        >
                          {orderStatuses[status].label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-white mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="text-gray-300">
                          <span className="font-medium">{item.quantity}x</span>{' '}
                          {item.name}
                        </div>
                        <div className="text-gray-400">₹{item.price * item.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No pending orders found</p>
            <button
              onClick={() => router.push('/menu')}
              className="mt-4 text-purple-400 hover:text-purple-300"
            >
              Order Food
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/orders')}
            className="text-sm text-gray-400 hover:text-purple-400"
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
} 