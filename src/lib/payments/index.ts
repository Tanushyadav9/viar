import { PaymentProvider } from './types';
import { razorpayProvider } from './razorpay';
import { stripeProvider } from './stripe';

/**
 * Payment Provider Factory
 * 
 * Requirements:
 * - Razorpay (India) live at launch
 * - Stripe (international) integrated behind the same PaymentProvider interface
 *   but may need to be toggled off via config until the client completes
 *   Stripe's Indian business registration.
 * - The checkout flow gracefully offers only Razorpay if the Stripe provider isn't configured.
 */

export function isStripeEnabled(): boolean {
  return stripeProvider.isConfigured();
}

export function isRazorpayEnabled(): boolean {
  return razorpayProvider.isConfigured();
}

export function getPaymentProvider(currency: 'INR' | 'USD'): PaymentProvider {
  if (currency === 'USD' && isStripeEnabled()) {
    return stripeProvider;
  }
  // Default to Razorpay for INR and anytime Stripe is unconfigured
  return razorpayProvider;
}

export function getAvailablePaymentProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [razorpayProvider];
  if (isStripeEnabled()) {
    providers.push(stripeProvider);
  }
  return providers;
}

export * from './types';
export { razorpayProvider, stripeProvider };
