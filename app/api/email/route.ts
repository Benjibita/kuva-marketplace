import { NextRequest, NextResponse } from 'next/server';
import { sendVendorOrderEmail } from '@/services/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, vendor_email, vendor_name, order_id, items, total } = body;

    if (action === 'send_vendor_email') {
      await sendVendorOrderEmail({
        vendor_email,
        vendor_name,
        order_id,
        items,
        total,
      });

      return NextResponse.json({
        success: true,
        message: 'Vendor email sent successfully',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    );
  }
}
