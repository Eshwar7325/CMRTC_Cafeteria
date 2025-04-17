'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [isLoading, setIsLoading] = useState(true);

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

    // Function to load orders
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('Orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Parse the items array for each order
        const parsedOrders = data.map(order => ({
          ...order,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
        }));

        setOrders(parsedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadOrders();

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
            
            // Update orders list
            setOrders(prevOrders => {
              const existingIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
              if (existingIndex >= 0) {
                const newOrders = [...prevOrders];
                newOrders[existingIndex] = updatedOrder;
                return newOrders;
              }
              return [...prevOrders, updatedOrder];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const currentOrders = orders.filter(order => 
    ['pending', 'preparing', 'ready'].includes(order.status)
  );
  
  const completedOrders = orders.filter(order => 
    order.status === 'completed'
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-200 border-yellow-700';
      case 'preparing':
        return 'bg-blue-900/50 text-blue-200 border-blue-700';
      case 'ready':
        return 'bg-green-900/50 text-green-200 border-green-700';
      default:
        return 'bg-gray-900/50 text-gray-200 border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-400">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">My Orders</h1>
          <button
            onClick={() => router.push('/menu')}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Order Food
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 mb-6">
          <div className="border-b border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('current')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'current'
                    ? 'border-b-2 border-purple-400 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Current Orders ({currentOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-purple-400 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Order History ({completedOrders.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {(activeTab === 'current' ? currentOrders : completedOrders)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by newest first
                .map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        Order {getDisplayToken(order.token_id)}
                      </h3>
                      <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                      <p className="text-sm font-medium text-purple-400 mt-2">
                        {order.category === 'san' ? 'Sandwich' : 
                         order.category === 'fry' ? 'Fries' : 
                         order.category === 'can' ? 'Canteen' : 
                         order.category}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-300">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-400">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                      <p className="text-lg font-semibold text-purple-400">
                        Total: ₹{order.total}
                      </p>
                      {order.status === 'ready' && (
                        <button
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase
                                .from('Orders')
                                .update({ status: 'completed' })
                                .eq('token_id', order.token_id)
                                .select();

                              if (error) {
                                console.error('Supabase error:', error);
                                throw error;
                              }

                              // Update local state
                              setOrders(prevOrders =>
                                prevOrders.map(o =>
                                  o.token_id === order.token_id ? { ...o, status: 'completed' } : o
                                )
                              );

                              toast.success('Order marked as completed!');
                            } catch (error) {
                              console.error('Error updating order status:', error);
                              toast.error('Failed to update order status');
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Confirm Pickup
                        </button>
                      )}
                      {order.status !== 'completed' && order.status !== 'ready' && (
                        <button
                          onClick={() => router.push(`/track-order?token_id=${order.token_id}`)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                        >
                          Track Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(activeTab === 'current' ? currentOrders : completedOrders).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    {activeTab === 'current'
                      ? 'No current orders'
                      : 'No order history'}
                  </p>
                  <button
                    onClick={() => router.push('/menu')}
                    className="mt-4 text-purple-400 hover:text-purple-300"
                  >
                    Order some food
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 