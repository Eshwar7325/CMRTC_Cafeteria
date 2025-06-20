import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name, value, options) {
          await cookieStore.set({ name, value, ...options });
        },
        async remove(name, options) {
          await cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  return NextResponse.json({ session });
} 