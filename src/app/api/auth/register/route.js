import { users } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      name,
      email,
      password,
      role: 'USER'
    };

    // Add to users array
    users.push(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 