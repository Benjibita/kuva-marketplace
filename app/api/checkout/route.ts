import { NextRequest, NextResponse } from 'next/server';
import { checkout } from '@/app/actions/checkout';

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
        error:
          error instanceof Error ? error.message : 'Checkout failed',
      },
      { status: 500 }
    );
  }
}
