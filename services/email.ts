/**
 * Email Service for Vendor Notifications
 * Sends order confirmation emails to vendors
 */

interface EmailPayload {
  vendor_email: string;
  vendor_name: string;
  order_id: string;
  items: {
    title: string;
    quantity: number;
    price: number;
  }[];
  total: number;
}

/**
 * Send vendor order notification email
 * Currently uses a mock implementation - integrate with real email provider
 * (SendGrid, Resend, AWS SES, etc.)
 */
export async function sendVendorOrderEmail(payload: EmailPayload) {
  try {
    // Mock email implementation
    console.log(`Sending email to vendor: ${payload.vendor_email}`, payload);

    // TODO: Integrate with real email provider
    // Example with Resend (https://resend.com):
    // const { data, error } = await resend.emails.send({
    //   from: 'noreply@kuvamarketplace.com',
    //   to: payload.vendor_email,
    //   subject: `New Order #${payload.order_id}`,
    //   html: generateVendorEmailHTML(payload),
    // });
    //
    // if (error) {
    //   console.error('Failed to send email:', error);
    //   throw error;
    // }
    // return data;

    // Mock response
    return {
      success: true,
      message: `Email would be sent to ${payload.vendor_email}`,
    };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

/**
 * Generate HTML email template for vendor order notification
 */
function generateVendorEmailHTML(payload: EmailPayload): string {
  const itemsHTML = payload.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
        ${item.title}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        UGX ${item.price.toLocaleString()}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #111827;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #000;
            color: white;
            padding: 24px;
            text-align: center;
          }
          .content {
            padding: 24px;
          }
          .order-id {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .total {
            display: flex;
            justify-content: flex-end;
            padding-top: 16px;
            border-top: 2px solid #000;
            font-weight: bold;
            font-size: 18px;
          }
          .footer {
            background: #f3f4f6;
            padding: 16px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Order Received</h1>
          </div>
          <div class="content">
            <p>Hello ${payload.vendor_name},</p>
            <p>You have received a new order on Kuva Marketplace:</p>
            
            <div class="order-id">
              <strong>Order ID:</strong> ${payload.order_id}
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th style="padding: 8px; border-bottom: 2px solid #000; text-align: left;">Product</th>
                  <th style="padding: 8px; border-bottom: 2px solid #000; text-align: center;">Qty</th>
                  <th style="padding: 8px; border-bottom: 2px solid #000; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div class="total">
              Total: UGX ${payload.total.toLocaleString()}
            </div>
            
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              Please prepare the items for shipment. The buyer will be notified once you mark the order as shipped.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kuva Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export type OrderDisputeEmailPayload = {
  supportEmail: string | null;
  orderId: string;
  buyerId: string;
  message: string;
};

/**
 * Notify platform support that a buyer submitted an order dispute.
 * Wire RESEND_API_KEY + SUPPORT_ADMIN_EMAIL when ready for production mail.
 */
export async function notifyOrderDisputeSubmitted(
  payload: OrderDisputeEmailPayload
) {
  const to = payload.supportEmail?.trim();
  if (!to) {
    console.info(
      "[order dispute] SUPPORT_ADMIN_EMAIL not set; skipping email.",
      { orderId: payload.orderId, buyerId: payload.buyerId }
    );
    return { sent: false as const };
  }

  console.log(`[order dispute] email to ${to}`, {
    orderId: payload.orderId,
    buyerId: payload.buyerId,
    preview: payload.message.slice(0, 200),
  });

  // TODO: Resend / SES — same pattern as sendVendorOrderEmail
  return { sent: true as const, to };
}
