export function formatEGP(amount) {
  if (amount == null) return '';
  try {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  } catch (e) {
    return `${amount} ج.م`;
  }
}
