import { NextRequest, NextResponse } from 'next/server';
import { checkout } from '@/app/actions/checkout';
import { messageFromUnknownError } from '@/lib/userFacingErrors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total } = body;

    if (!items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await checkout(items, total);

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: result.message,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        error: messageFromUnknownError(
          error,
          'Checkout could not be completed. Please try again.'
        ),
      },
      { status: 500 }
    );
  }
}
