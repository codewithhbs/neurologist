import RazorpayCheckout from 'react-native-razorpay';


export async function payWithRazorpay({ order, keyId, description, prefill = {} }) {
  const options = {
    description: description || '',
    currency: order.currency,
    key: keyId,
    amount: order.amount,
    name: 'Neurocare Clinic',
    order_id: order.id,
    prefill: {
      name: prefill.name || '',
      contact: prefill.contact || '',
      email: prefill.email || '',
    },
    theme: { color: '#2563eb' },
  };

  return RazorpayCheckout.open(options);
}