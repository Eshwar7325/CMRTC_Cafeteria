'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Order status styles for visual indicators
const orderStatusStyles = {
  pending: { bg: 'bg-yellow-900/50', text: 'text-yellow-200', border: 'border-yellow-700' },
  preparing: { bg: 'bg-blue-900/50', text: 'text-blue-200', border: 'border-blue-700' },
  ready: { bg: 'bg-green-900/50', text: 'text-green-200', border: 'border-green-700' },
  completed: { bg: 'bg-gray-900/50', text: 'text-gray-200', border: 'border-gray-700' },
};

export default function TotalOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [adminCategory, setAdminCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('completed'); // Default to completed orders
  const [dateFilter, setDateFilter] = useState('month'); // Default to monthly view
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [totalStats, setTotalStats] = useState({
    totalOrders: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    // Check if user is logged in and is admin
    const sessionId = localStorage.getItem('sessionId');
    const userRole = localStorage.getItem('userRole');
    const category = localStorage.getItem('adminCategory');
    
    if (!sessionId || userRole !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    setAdminCategory(category);

    // Get category name
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
    fetchOrders();

    // Subscribe to real-time updates for this specific category
    const ordersSubscription = supabase
      .channel('category_orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'Orders', 
        filter: `category=eq.${category}` 
      }, payload => {
        // Just refetch orders for simplicity
        fetchOrders();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [router]);

  // Fetch orders for the admin's category 
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const category = localStorage.getItem('adminCategory');

      let query = supabase
        .from('Orders')
        .select('*')
        .eq('category', category) // Filter by admin's category
        .order('created_at', { ascending: false });

      // Apply date filtering
      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
        return;
      }

      if (data) {
        // Parse the items array for each order
        const parsedOrders = data.map(order => ({
          ...order,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
        }));
        
        setOrders(parsedOrders);
        
        // Calculate total stats - focus on monthly data
        const totalOrders = parsedOrders.length;
        
        // Calculate monthly revenue from completed orders
        const monthlyRevenue = parsedOrders
          .filter(order => order.status === 'completed')
          .reduce((total, order) => total + parseFloat(order.total || 0), 0);
        
        setTotalStats({
          totalOrders,
          monthlyRevenue
        });
      }
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      
      // Update the order status
      const { error } = await supabase
        .from('Orders')
        .update({ status: newStatus })
        .eq('token_id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      // Update the order in the local state
      setOrders(prev => 
        prev.map(order => 
          order.token_id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );

      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    return statusMatch;
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">{categoryName} Orders</h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Total Orders</h3>
            <p className="text-3xl font-bold text-purple-400">
              {totalStats.totalOrders}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-purple-400">
              ₹{totalStats.monthlyRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Time Period</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                // Re-fetch orders when date filter changes
                setTimeout(() => fetchOrders(), 100);
              }}
              className="rounded-md border-gray-700 bg-gray-800 text-white text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Completed Orders</h2>
          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div key={order.token_id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">Order #{order.display_token || order.token_id}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${orderStatusStyles[order.status].bg} ${orderStatusStyles[order.status].text} ${orderStatusStyles[order.status].border}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(order.items) ? order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm text-gray-300">
                        <span>{item.name}</span>
                        <div className="flex space-x-4">
                          <span>x{item.quantity}</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-300">No items data available</div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
                    <span className="font-medium text-gray-300">Total</span>
                    <span className="font-medium text-purple-400">₹{parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">No completed orders found for the selected time period</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}