// Mock database using arrays
export const users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: '123456',
    role: 'STUDENT'
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    password: '123456',
    role: 'STUDENT'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: '123456',
    role: 'STUDENT'
  },
  {
    id: '4',
    name: 'Canteen Admin',
    email: 'canteen@example.com',
    password: 'admin123',
    role: 'ADMIN',
    stall: 'Canteen'
  },
  {
    id: '5',
    name: 'Sandwich Stall Admin',
    email: 'sandwich@example.com',
    password: 'admin123',
    role: 'ADMIN',
    stall: 'Sandwich Stall'
  },
  {
    id: '6',
    name: 'Fries Stall Admin',
    email: 'fries@example.com',
    password: 'admin123',
    role: 'ADMIN',
    stall: 'Fries Stall'
  }
];

export const menuItems = [
  {
    id: '1',
    name: 'Chicken Biryani',
    description: 'Fragrant rice cooked with tender chicken and aromatic spices',
    price: 120,
    stall: 'Canteen',
    category: 'Canteen',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1887&auto=format&fit=crop',
    stock: 50
  },
  {
    id: '2',
    name: 'Veg Club Sandwich',
    description: 'Triple-decker sandwich with fresh vegetables and cheese',
    price: 80,
    stall: 'Sandwich Stall',
    category: 'Sandwiches',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=1773&auto=format&fit=crop',
    stock: 30
  },
  {
    id: '3',
    name: 'Loaded Cheese Fries',
    description: 'Crispy fries topped with melted cheese and herbs',
    price: 90,
    stall: 'Fries Stall',
    category: 'Fries',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1374&auto=format&fit=crop',
    stock: 40
  },
  {
    id: '4',
    name: 'Idli',
    description: 'Crispy rice crepe filled with spiced potato filling',
    price: 70,
    stall: 'Canteen',
    category: 'Canteen',
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?q=80&w=1450&auto=format&fit=crop',
    stock: 45
  },
  {
    id: '5',
    name: 'Grilled Chicken Sandwich',
    description: 'Grilled chicken with lettuce, tomato, and special sauce',
    price: 100,
    stall: 'Sandwich Stall',
    category: 'Sandwiches',
    image: 'https://images.unsplash.com/photo-1475090169767-40ed8d18f67d?q=80&w=1632&auto=format&fit=crop',
    stock: 25
  },
  {
    id: '6',
    name: 'Cheesy Nachos',
    description: 'Tortilla chips loaded with cheese, jalapeños, and salsa',
    price: 110,
    stall: 'Fries Stall',
    category: 'Fries',
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=1935&auto=format&fit=crop',
    stock: 35
  },
  {
    id: '7',
    name: 'Veg Fried Rice',
    description: 'Stir-fried rice with mixed vegetables and soy sauce',
    price: 95,
    stall: 'Canteen',
    category: 'Canteen',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=1925&auto=format&fit=crop',
    stock: 40
  },
  {
    id: '8',
    name: 'Peri Peri Fries',
    description: 'A zesty sauce made with lemon and oregano adds zip and contrast to savory Sysco french fries',
    price: 60,
    stall: 'Fries Stall',
    category: 'Fries',
    image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?q=80&w=2070&auto=format&fit=crop',
    stock: 30
  },
  {
    id: '9',
    name: 'Momos',
    description: 'Rich and creamy chocolate milkshake with whipped cream',
    price: 70,
    stall: 'Fries Stall',
    category: 'Fries',
    image: 'https://plus.unsplash.com/premium_photo-1661600407445-f672740d5c53?q=80&w=2071&auto=format&fit=crop',
    stock: 30
  },
  {
    id: '10',
    name: 'Paneer Tikka Sandwich',
    description: 'Grilled cottage cheese with Indian spices in sandwich',
    price: 85,
    stall: 'Sandwich Stall',
    category: 'Sandwiches',
    image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?q=80&w=1772&auto=format&fit=crop',
    stock: 20
  },
  {
    id: '11',
    name: 'Samosa',
    description: 'Crispy pastry filled with spiced potatoes and peas',
    price: 30,
    stall: 'Canteen',
    category: 'Canteen',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=2070&auto=format&fit=crop',
    stock: 60
  },
  {
    id: '12',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato and butter gravy',
    price: 150,
    stall: 'Canteen',
    category: 'Canteen',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=2070&auto=format&fit=crop',
    stock: 35
  }
];

// In-memory orders array
let orders = [];

export function generateOrderId() {
  return 'ORD' + Date.now().toString(36).toUpperCase();
}

export function addOrder(order) {
  orders.push(order);
  return order;
}

export function updateOrderStatus(orderId, newStatus) {
  const orderIndex = orders.findIndex(order => order.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    return orders[orderIndex];
  }
  return null;
}

export function getOrdersByUserId(userId) {
  return orders.filter(order => order.userId === userId);
}

export function getOrdersByStall(stall) {
  return orders.filter(order => order.stall === stall);
}

export function getAllOrders() {
  return orders;
}

// For client-side use only
export function syncOrdersWithLocalStorage() {
  if (typeof window !== 'undefined') {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      try {
        orders = JSON.parse(savedOrders);
      } catch (error) {
        console.error('Error parsing orders from localStorage:', error);
        orders = [];
      }
    }
  }
}

// For client-side use only
export function saveOrdersToLocalStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orders', JSON.stringify(orders));
  }
} 