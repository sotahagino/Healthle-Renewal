import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  console.log('Test webhook endpoint called');
  
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    console.log('Request details:', {
      body: body.substring(0, 500),
      signature: signature,
      headers: Object.fromEntries(headers().entries())
    });

    return NextResponse.json({ 
      received: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Test webhook failed' },
      { status: 500 }
    );
  }
} 