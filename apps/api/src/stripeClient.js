import Stripe from 'stripe'
const key=process.env.STRIPE_SECRET_KEY;export const stripe=key?new Stripe(key,{apiVersion:'2023-10-16'}):null
