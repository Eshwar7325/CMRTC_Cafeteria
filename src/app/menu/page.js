'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Menu() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      router.push('/student/login');
      return;
    }

    // Load cart from localStorage only
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (err) {
        console.error('Error parsing cart data:', err);
        setCart([]);
        localStorage.removeItem('cart');
      }
    }

    // Fetch categories
    const getCategories = async () => {
      const { data, error } = await supabase
        .from('Categories')
        .select('*')
        .order('name');

      if (data) {
        setCategories(['all', ...data.map(cat => cat.slug)]);
      }
    };

    // Fetch items
    const getItems = async () => {
      const { data, error } = await supabase
        .from('Items')
        .select('*')
        .order('name');

      if (data) {
        setItems(data);
      }
      setLoading(false);
    };

    getCategories();
    getItems();
  }, [router]);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      const newCart = existingItem
        ? prevCart.map(cartItem =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        : [...prevCart, { ...item, quantity: 1 }];
      
      // Update localStorage with the new cart
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
    toast.success('Item added to cart');
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== itemId);
      // Update localStorage with the new cart
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
    toast.success('Item removed from cart');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Save cart to localStorage before navigation
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Navigate to payment page with encoded cart data
    router.push(`/payment?cart=${encodeURIComponent(JSON.stringify(cart))}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-400">Loading menu items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Menu</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-1 rounded-md border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : 
                 category === 'can' ? 'Canteen' :
                 category === 'fry' ? 'Fries' :
                 category === 'san' ? 'Sandwich' :
                 category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="px-3 py-1 rounded-md border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
              <div className="relative h-48">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400">
                      {item.category === 'can' ? 'Canteen' :
                       item.category === 'fry' ? 'Fries' :
                       item.category === 'san' ? 'Sandwich' :
                       item.category}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-purple-400">₹{item.price}</span>
                </div>
                <p className="text-sm text-gray-300 mb-4">{item.Description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                    {cart.some(cartItem => cartItem.id === item.id) && (
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {cart.some(cartItem => cartItem.id === item.id) && (
                    <span className="text-sm text-gray-400">
                      Quantity: {cart.find(cartItem => cartItem.id === item.id).quantity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 shadow-lg border-t border-gray-700 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-white">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </p>
                <p className="text-2xl font-bold text-purple-400">₹{getTotalPrice()}</p>
              </div>
              <button
                onClick={handleCheckout}
                className="bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700 transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 