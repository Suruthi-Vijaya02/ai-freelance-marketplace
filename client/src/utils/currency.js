export const CURRENCY_RATES = { 
   USD: 1, 
   EUR: 0.92, 
   INR: 83.5, 
   GBP: 0.79, 
   AED: 3.67, 
 }; 
 
 export const CURRENCY_SYMBOLS = { 
   USD: '$', 
   EUR: '€', 
   INR: '₹', 
   GBP: '£', 
   AED: 'AED', 
 }; 
 
 /** 
  * Converts a USD amount to the target currency. 
  * @param {number} amountInUSD 
  * @param {string} currency - one of the keys in CURRENCY_RATES 
  * @returns {string} formatted amount with symbol 
  */ 
 export function formatCurrency(amountInUSD, currency = 'USD') { 
   const rate = CURRENCY_RATES[currency] ?? 1; 
   const symbol = CURRENCY_SYMBOLS[currency] ?? '$'; 
   return `${symbol}${(amountInUSD * rate).toFixed(2)}`; 
 } 
