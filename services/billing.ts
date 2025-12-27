import { DonationProduct } from '../types';

// These IDs must match what you eventually create in Google Play Console
export const PRODUCTS: DonationProduct[] = [
  {
    id: 'donate_tier_1',
    title: 'Apoyo Básico',
    price: '$1.00 USD',
    description: 'Contribuye al mantenimiento de los servidores y corrección de errores.',
    icon: '🥉'
  },
  {
    id: 'donate_tier_2',
    title: 'Apoyo Destacado',
    price: '$3.00 USD',
    description: 'Ayuda a desarrollar nuevas funciones como mapas y estadísticas avanzadas.',
    icon: '🥈',
    recommended: true
  },
  {
    id: 'donate_tier_3',
    title: 'Patrocinador Gold',
    price: '$5.00 USD',
    description: 'Tu aporte garantiza que la app siga siendo gratuita y libre de publicidad.',
    icon: '🥇'
  }
];

// Mock function to simulate a purchase flow
// Later, this will be replaced by Capacitor Google Play Billing calls
export const purchaseProduct = async (productId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`Simulating purchase for: ${productId}`);
    // Simulate network delay
    setTimeout(() => {
      // In a real app, here we would trigger the Google Play sheet
      // For now, we always return true (success)
      resolve(true);
    }, 1500);
  });
};