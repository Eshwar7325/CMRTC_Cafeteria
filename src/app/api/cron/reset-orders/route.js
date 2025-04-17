import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This endpoint will be called by a cron job to reset orders daily
export async function GET(request) {
  try {
    // Check for authorization - this can be a secret key check to ensure only authorized services can call this endpoint
    const authorization = request.headers.get('authorization');
    const apiKey = process.env.CRON_API_KEY;
    
    // Validate API key if it's configured
    if (apiKey && (!authorization || authorization !== `Bearer ${apiKey}`)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Archive completed orders that are older than today
    // Copy them to OrdersArchive table if needed
    const { data: oldOrders, error: fetchError } = await supabase
      .from('Orders')
      .select('*')
      .lt('created_at', `${today}T00:00:00`);
    
    if (fetchError) {
      console.error('Error fetching old orders:', fetchError);
      throw fetchError;
    }
    
    // If we want to archive orders before deleting
    if (oldOrders && oldOrders.length > 0) {
      console.log(`Archiving ${oldOrders.length} old orders`);
      
      // Optional: Insert into archive table
      // const { error: archiveError } = await supabase
      //  .from('OrdersArchive')
      //  .insert(oldOrders);
      
      // if (archiveError) {
      //   console.error('Error archiving orders:', archiveError);
      //   throw archiveError;
      // }
    }
    
    // 2. Delete old orders from the main table
    const { error: deleteError } = await supabase
      .from('Orders')
      .delete()
      .lt('created_at', `${today}T00:00:00`);
    
    if (deleteError) {
      console.error('Error deleting old orders:', deleteError);
      throw deleteError;
    }

    // 3. Reset category counters in localStorage
    // This can't be done directly from server API routes since localStorage is client-side
    // Instead, we'll create a flag in the database that clients can check to know when to reset
    
    const { error: resetFlagError } = await supabase
      .from('SystemSettings')
      .upsert({
        key: 'last_reset_date',
        value: today
      });
    
    if (resetFlagError) {
      console.error('Error updating reset flag:', resetFlagError);
      throw resetFlagError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Orders reset successful',
      date: today,
      ordersProcessed: oldOrders?.length || 0
    });
  } catch (error) {
    console.error('Error resetting orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset orders',
        details: error.message
      },
      { status: 500 }
    );
  }
} 