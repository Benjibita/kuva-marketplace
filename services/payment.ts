// Modular service for handling payments via Flutterwave

export interface PaymentRequest {
  tx_ref: string;
  amount: number; // Amount in UGX
  phone_number: string;
  email: string;
  fullname: string;
  network: 'MTN' | 'AIRTEL';
}

export const processMobileMoneyPayment = async (payload: PaymentRequest) => {
  // Using Flutterwave specifically targeted for mobile_money_uganda
  
  // Note: In a real app, this should be called from a secure Server Action or API route
  // because the FLW_SECRET_KEY must never be exposed to the client.
  
  const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
  
  if (!FLW_SECRET_KEY) {
    console.warn("Flutterwave secret key is not set. Mocking payment response.");
    return { status: 'success', message: 'Mock payment initiated' };
  }

  try {
    const response = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_uganda', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref: payload.tx_ref,
        amount: payload.amount,
        currency: 'UGX',
        network: payload.network,
        email: payload.email,
        phone_number: payload.phone_number,
        fullname: payload.fullname,
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/callback`
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
};
