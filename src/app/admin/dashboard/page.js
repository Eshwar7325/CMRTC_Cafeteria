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

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [adminCategory, setAdminCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalStats, setTotalStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  
  // Add Item Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: 0,
    description: '',
    image: '',
    Availability: true,
    category: ''
  });
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Function to get display token
  const getDisplayToken = (tokenId) => {
    const totalOrders = orders.length;
    if (totalOrders >= 100) {
      return (tokenId % 100) + 100;
    }
    return tokenId % 100;
  };

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

    // Fetch orders for this category
    fetchOrders();
    
    // Fetch inventory items for this category
    fetchInventory();

    // Subscribe to real-time updates
    const ordersSubscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Orders', filter: `category=eq.${category}` }, payload => {
        // Instead of fetching the entire list again, update the state with the parsed order
        if (payload.eventType === 'INSERT') {
          const newOrder = {
            ...payload.new,
            items: typeof payload.new.items === 'string' ? JSON.parse(payload.new.items) : payload.new.items
          };
          setOrders(prev => [newOrder, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = {
            ...payload.new,
            items: typeof payload.new.items === 'string' ? JSON.parse(payload.new.items) : payload.new.items
          };
          setOrders(prev => prev.map(order => order.token_id === updatedOrder.token_id ? updatedOrder : order));
        } else {
          // For DELETE events or as a fallback, refresh the whole list
          fetchOrders();
        }
      })
      .subscribe();

    const inventorySubscription = supabase
      .channel('inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Items', filter: `category=eq.${category}` }, payload => {
        fetchInventory();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      inventorySubscription.unsubscribe();
    };
  }, [router]);

  // Function to fetch orders
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const category = localStorage.getItem('adminCategory');

      // Calculate timestamp for 8 hours ago
      const eightHoursAgo = new Date();
      eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);

      let query = supabase
        .from('Orders')
        .select('*')
        .eq('category', category) // Filter by admin's category
        .gte('created_at', eightHoursAgo.toISOString()) // Only orders from last 8 hours
        .order('created_at', { ascending: false });

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
        
        // Calculate total stats
        const totalOrders = parsedOrders.length;
        const pendingOrders = parsedOrders.filter(order => 
          ['pending', 'preparing', 'ready'].includes(order.status)
        ).length;
        const totalRevenue = parsedOrders
          .filter(order => order.status === 'completed')
          .reduce((total, order) => total + parseFloat(order.total || 0), 0);
        
        setTotalStats({
          totalOrders,
          pendingOrders,
          totalRevenue
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
      
      // First get the order details to get the user's phone number
      const { data: orderData, error: fetchError } = await supabase
        .from('Orders')
        .select('*, User(phone)')
        .eq('token_id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching order details:', fetchError);
        throw fetchError;
      }

      console.log('Found order data:', orderData);

      // Update the order status
      const { error: updateError } = await supabase
        .from('Orders')
        .update({ status: newStatus })
        .eq('token_id', orderId);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        throw updateError;
      }

      // If status is 'ready' and we have the user's phone number, send SMS
      if (newStatus === 'ready' && orderData.User?.phone) {
        const message = `CMRTC Cafeteria: Your order (Token: ${orderData.display_token || orderData.token_id}) is ready for collection. Please collect it from the counter.`;
        
        // Get and validate the phone number
        const phoneNumber = orderData.User?.phone || '';
        
        try {
          // Attempt to send SMS, but don't let it fail the whole process
          const response = await fetch('/api/send-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber: phoneNumber,
              message: message
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to send SMS notification:', errorData);
            // Show a warning but don't stop the flow
            toast.error('Order status updated but SMS notification failed to send.');
          } else {
            toast.success('Order status updated and SMS notification sent.');
          }
        } catch (smsError) {
          console.error('Error sending SMS:', smsError);
          // Show a warning but don't stop the flow
          toast.error('Order status updated but SMS notification failed to send.');
        }
      } else {
        // Regular success message for other status changes
        toast.success('Order status updated successfully');
      }

      // Refresh orders after update
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateInventoryItem = async (itemId, updates) => {
    try {
      const { error } = await supabase
        .from('Items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      setInventory(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, ...updates }
            : item
        )
      );
      toast.success('Item updated successfully');
    } catch (err) {
      toast.error('Failed to update item');
    }
  };

  // Function to fetch inventory
  const fetchInventory = async () => {
    try {
      const category = localStorage.getItem('adminCategory');
      const { data, error } = await supabase
        .from('Items')
        .select('*')
        .eq('category', category);

      if (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Failed to fetch inventory');
        return;
      }

      if (data) {
        setInventory(data);
      }
    } catch (err) {
      console.error('Error in fetchInventory:', err);
      toast.error('Failed to fetch inventory');
    }
  };

  const addNewItem = async () => {
    try {
      setIsAddingItem(true);
      
      // Validate form fields
      if (!newItem.name || newItem.price === undefined) {
        toast.error('Name and price are required');
        return;
      }

      // Log database state before insertion
      const { data: tableInfo, error: tableError } = await supabase
        .from('Items')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('Error checking Items table:', tableError);
      } else {
        console.log('Items table exists and is accessible');
      }
      
      // Set the category from the admin's assigned category
      const itemToAdd = {
        name: newItem.name.trim(),
        price: Number(newItem.price), // Ensure price is a number
        description: newItem.description?.trim() || '', // Ensure description is not null
        image: newItem.image?.trim() || 'https://via.placeholder.com/300', // Provide a default image if not set
        Availability: Boolean(newItem.Availability), // Ensure boolean value
        category: adminCategory // Use the admin's category
      };
      
      console.log('Attempting to add item:', itemToAdd);
      
      // Create item without specifying any ID
      const insertData = {
        name: itemToAdd.name,
        price: itemToAdd.price,
        "Description": itemToAdd.description, 
        image: itemToAdd.image,
        "Availability": itemToAdd.Availability,
        category: itemToAdd.category
      };
      
      // First attempt - simple insert
      const { data, error } = await supabase
        .from('Items')
        .insert([insertData])
        .select('*');
      
      if (error) {
        console.error('Supabase error adding item:', error);
        
        // If primary key violation, try with upsert and a custom approach
        if (error.code === '23505') {
          console.log('Primary key violation detected. Trying with fallback approach...');
          
          try {
            // First, get the max ID to understand the next available ID
            const { data: maxIdData } = await supabase
              .from('Items')
              .select('id')
              .order('id', { ascending: false })
              .limit(1);
            
            const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
            console.log('Next available ID should be:', nextId);
            
            // Try to use RPC function if available
            try {
              const { data: rpcData, error: rpcError } = await supabase.rpc('reset_items_sequence', { 
                next_val: nextId + 1 
              });
              
              if (rpcError) {
                console.error('Error resetting sequence:', rpcError);
                throw rpcError; // Fall through to the simpler approach
              } else {
                console.log('Sequence reset result:', rpcData);
                toast.success('Database sequence reset. Please try adding the item again.');
                return;
              }
            } catch (rpcError) {
              console.log('RPC function not available or failed. Using direct ID insertion instead.');
              
              // Simple approach: Try to insert with an explicit ID that we know is available
              const { data: directData, error: directError } = await supabase
                .from('Items')
                .insert([{
                  id: nextId + 5, // Add some buffer to avoid races
                  ...insertData
                }])
                .select('*');
              
              if (directError) {
                console.error('Direct insertion failed:', directError);
                toast.error(`All insertion methods failed. Please try again later or contact support.`);
              } else if (directData && directData[0]) {
                console.log('Item added successfully with explicit ID:', directData[0]);
                setInventory(prev => [...prev, directData[0]]);
                
                // Reset form and close modal
                setNewItem({
                  name: '',
                  price: 0,
                  description: '',
                  image: '',
                  Availability: true,
                  category: ''
                });
                
                setShowAddItemModal(false);
                toast.success('Item added successfully');
                fetchInventory();
                return;
              }
            }
          } catch (seqError) {
            console.error('Error in sequence handling:', seqError);
            toast.error(`Database error: ${seqError.message}`);
            setIsAddingItem(false);
            return;
          }
        }
        
        // For other types of errors
        toast.error(`Failed to add item: ${error.message}`);
        setIsAddingItem(false);
        return;
      }
      
      // Success path
      if (data && data[0]) {
        console.log('Item added successfully:', data[0]);
        setInventory(prev => [...prev, data[0]]);
        
        // Reset form
        setNewItem({
          name: '',
          price: 0,
          description: '',
          image: '',
          Availability: true,
          category: ''
        });
        
        // Close modal
        setShowAddItemModal(false);
        
        toast.success('Item added successfully');
        
        // Reload inventory to ensure UI is in sync with database
        fetchInventory();
      } else {
        console.error('No data returned from insert operation');
        toast.error('Failed to add item: No data returned');
      }
    } catch (err) {
      console.error('Error adding item:', err);
      toast.error(`Failed to add item: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAddingItem(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!adminCategory) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">{categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Dashboard</h1>
          <button
            onClick={() => router.push('/admin/Total-Orders')}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            View Monthly Summary
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Total Orders Today</h3>
            <p className="text-3xl font-bold text-purple-400">
              {orders.filter(order => {
                const orderDate = new Date(order.created_at);
                const today = new Date();
                return orderDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Pending Orders</h3>
            <p className="text-3xl font-bold text-purple-400">
              {orders.filter(order => (order.status === 'pending' || order.status === 'preparing' || order.status === 'ready')).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Total Revenue Today</h3>
            <p className="text-3xl font-bold text-purple-400">
              ₹{orders
                .filter(order => {
                  const orderDate = new Date(order.created_at);
                  const today = new Date();
                  return orderDate.toDateString() === today.toDateString() && order.status === 'completed';
                })
                .reduce((total, order) => total + parseFloat(order.total || 0), 0)
              }
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-purple-400 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'inventory'
                    ? 'border-b-2 border-purple-400 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveTab('token')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'token'
                    ? 'border-b-2 border-purple-400 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Token Number
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'orders' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Orders List</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Filter:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-md border-gray-700 bg-gray-800 text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                {orders
                  .filter(order => statusFilter === 'all' || order.status === statusFilter)
                  .map((order) => (
                    <div key={order.token_id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-white">Order {getDisplayToken(order.token_id)}</h3>
                          <p className="text-sm text-gray-400">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {getDisplayToken(order.token_id)} {order.token_id ? `• Token: ${getDisplayToken(order.token_id)}` : ''}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${orderStatusStyles[order.status].bg} ${orderStatusStyles[order.status].text} ${orderStatusStyles[order.status].border}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {updatingOrderId === order.token_id && (
                            <div className="mr-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                            </div>
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.token_id, e.target.value)}
                            className={`rounded-md border-gray-700 bg-gray-800 text-white text-sm focus:ring-purple-500 focus:border-purple-500 pl-2 w-full sm:w-auto ${
                              (updatingOrderId === order.token_id || order.status === 'completed') ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            // disabled={updatingOrderId === order.token_id || order.status === 'completed'}
                          >
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(order.items) ? order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm text-gray-300">
                            <span>{item.name}</span>
                            <span>x{item.quantity}</span>
                          </div>
                        )) : (
                          <div className="text-sm text-gray-300">No items data available</div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
                        <span className="font-medium text-gray-300">Total</span>
                        <span className="font-medium text-purple-400">₹{order.total}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : activeTab === 'token' ? (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Token Numbers</h2>
                <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-700">
                  <h3 className="text-lg font-medium text-purple-400 mb-4">{categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</h3>
                  <div className="space-y-2">
                    {(() => {
                      console.log('Current adminCategory:', adminCategory);
                      let startNum, length;
                      const category = adminCategory?.toLowerCase();
                      console.log('Normalized category:', category);
                      
                      switch(category) {
                        case 'can':
                          startNum = 1;
                          length = 500;
                          break;
                        case 'fry':
                          startNum = 501;
                          length = 300;
                          break;
                        case 'san':
                          startNum = 801;
                          length = 300;
                          break;
                        default:
                          console.log('Invalid category:', category);
                          return <div className="text-red-400">Invalid category</div>;
                      }
                      const tokens = Array.from({ length }, (_, i) => i + startNum);
                      return (
                        <div className="h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-700">
                          <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-3">
                            {tokens.map((num) => {
                              const order = orders.find(o => o.token_id === num);
                              const isCompleted = order?.status === 'completed';
                              return (
                                <div key={num} className="flex flex-col items-center">
                                  <span className={`${isCompleted ? 'bg-red-600' : 'bg-green-600'} text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center text-xs sm:text-sm mb-1`}>
                                    {num <= startNum + 98 ? num - startNum + 1 : 
                                     num <= startNum + 299 ? num - startNum + 1 : num}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-white">Inventory Management</h2>
                  <button 
                    onClick={() => setShowAddItemModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Item
                  </button>
                </div>
                
                {inventory.map((item) => (
                  <div key={item.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4">
                    <div>
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <p className="text-sm text-gray-400 sm:hidden">Price: {item.price}</p>
                    </div>
                    <div className="flex flex-row justify-around items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Price:</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateInventoryItem(item.id, { price: parseInt(e.target.value) })}
                          className="w-20 rounded-md border-gray-700 bg-gray-800 text-white text-sm focus:ring-purple-500 focus:border-purple-500 px-2 py-1 sm:px-4 sm:py-3"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Available:</span>
                        <div 
                          onClick={() => updateInventoryItem(item.id, { Availability: !item.Availability })}
                          className={`w-12 h-6 flex items-center ${item.Availability ? 'bg-green-600' : 'bg-gray-600'} rounded-full px-1 cursor-pointer`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${item.Availability ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-white">Add New Menu Item</h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full p-2 rounded-md border-gray-700 bg-gray-900 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Item name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    const price = value === '' ? 0 : parseInt(value, 10);
                    setNewItem({...newItem, price: price});
                  }}
                  className="w-full p-2 rounded-md border-gray-700 bg-gray-900 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full p-2 rounded-md border-gray-700 bg-gray-900 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Item description"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={newItem.image}
                  onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                  className="w-full p-2 rounded-md border-gray-700 bg-gray-900 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="flex items-center">
                <label className="text-sm font-medium text-gray-400 mr-2">Available</label>
                <div 
                  onClick={() => setNewItem({...newItem, Availability: !newItem.Availability})}
                  className={`w-12 h-6 flex items-center ${newItem.Availability ? 'bg-green-600' : 'bg-gray-600'} rounded-full px-1 cursor-pointer`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${newItem.Availability ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={addNewItem}
                disabled={isAddingItem || !newItem.name || !newItem.price}
                className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center ${(isAddingItem || !newItem.name || !newItem.price) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAddingItem ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 