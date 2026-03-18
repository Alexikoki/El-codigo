import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

// % fijo que se lleva la plataforma sobre la comisión generada
export const PLATAFORMA_PCT = 0.05 // 5%
