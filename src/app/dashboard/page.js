'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('current');
  const [orders, setOrders] = useState(sampleOrders);

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
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          {/* Dashboard Header */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-6">
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <Link
                href="/menu"
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                Order Food
              </Link>
            </div>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('current')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'current'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Current Orders
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Order History
              </button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            <div className="grid gap-6">
              {(activeTab === 'current' ? currentOrders : completedOrders).map((order) => (
                <div
                  key={order.id}
                  className="bg-white border rounded-lg shadow-sm p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-gray-500">{formatDate(order.timestamp)}</p>
                    </div>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Items</h4>
                      <div className="mt-2 space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-500">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500">{order.stall}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          Total: ₹{order.total}
                        </p>
                      </div>
                      {order.status === 'ready' && (
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          onClick={() => {
                            // Implement pickup confirmation
                          }}
                        >
                          Confirm Pickup
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(activeTab === 'current' ? currentOrders : completedOrders).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {activeTab === 'current'
                      ? 'No current orders'
                      : 'No order history'}
                  </p>
                  <Link
                    href="/menu"
                    className="mt-4 inline-block text-orange-600 hover:text-orange-700"
                  >
                    Order some food
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 