import { users } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers });
    }

    // Parse request body
    const body = await request.json().catch(() => null);
    
    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers }
      );
    }

    const { email, password, role } = body;
    
    // Find user with matching credentials
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers }
      );
    }

    // Check if user role matches the requested role
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 403, headers }
      );
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // Return user data and session info
    return NextResponse.json({
      user: userWithoutPassword,
      userId: user.id,
      sessionId: Math.random().toString(36).substring(7),
      message: 'Login successful'
    }, { headers });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
} 