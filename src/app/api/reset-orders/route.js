import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// This endpoint allows manual reset of orders by an authenticated admin user
export async function POST(request) {
  try {
    // Verify authentication by checking the supabase cookie or token
    // Use server-side auth verification using cookies
    const requestUrl = new URL(request.url);
    const requestHeaders = new Headers(request.headers);
    
    // Create a Supabase client using cookies for auth
    const supabaseServerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false
        },
        global: {
          headers: {
            cookie: requestHeaders.get('cookie') || ''
          }
        }
      }
    );
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabaseServerClient.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized access. Please log in.' },
        { status: 401 }
      );
    }

    // Get user information to verify admin status
    const { data: userData, error: userError } = await supabaseServerClient
      .from('User')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData || userData.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin users can reset orders' },
        { status: 403 }
      );
    }

    // Parse request body for any specific reset parameters
    const requestData = await request.json().catch(() => ({}));
    const { category, resetCounters = true, deleteOrders = true } = requestData;

    // Get current date
    const today = new Date().toISOString().split('T')[0];

    // Construct filter for the query
    let query = supabase.from('Orders');
    
    if (deleteOrders) {
      // Delete operations based on category filter
      if (category) {
        query = query.delete().eq('category', category);
      } else {
        query = query.delete();
      }
      
      const { error: deleteError } = await query;

      if (deleteError) {
        console.error('Error deleting orders:', deleteError);
        throw deleteError;
      }
    }

    // If we need to reset counters
    if (resetCounters) {
      // Update the reset flag in the database
      const { error: resetFlagError } = await supabase
        .from('SystemSettings')
        .upsert({
          key: category ? `last_reset_date_${category}` : 'last_reset_date',
          value: today
        });
      
      if (resetFlagError) {
        console.error('Error updating reset flag:', resetFlagError);
        throw resetFlagError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Orders ${deleteOrders ? 'deleted' : ''} ${resetCounters ? 'and counters reset' : ''} successfully`,
      category: category || 'all',
      date: today
    });
  } catch (error) {
    console.error('Error in manual order reset:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset orders',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 