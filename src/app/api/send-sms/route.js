import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Check if Twilio credentials are available
const isTwilioConfigured = !!(accountSid && authToken && twilioPhoneNumber);

// Only create client if credentials are available
const client = isTwilioConfigured ? twilio(accountSid, authToken) : null;

export async function POST(request) {
  try {
    // Check if Twilio is configured
    if (!isTwilioConfigured) {
      console.error('Twilio credentials are not configured');
      return NextResponse.json(
        { error: 'SMS service is not configured', details: 'Missing Twilio credentials' },
        { status: 503 } // Service Unavailable
      );
    }

    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Format phone number to ensure it has country code if needed
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    console.log(`Attempting to send SMS to ${formattedPhone}`);
    
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`SMS sent successfully: ${result.sid}`);
    return NextResponse.json({ success: true, messageId: result.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to send SMS',
        details: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}

// Helper function to format phone number
function formatPhoneNumber(phone) {
  // Ensure phone is a string
  const phoneStr = String(phone || '');
  
  // If the phone number doesn't start with +, assume it's an Indian number and add +91
  if (!phoneStr.startsWith('+')) {
    return `+91${phoneStr.replace(/^0/, '')}`;
  }
  return phoneStr;
} 