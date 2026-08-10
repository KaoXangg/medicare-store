import slugify from 'slugify';

export const slug = (text) =>
  slugify(text, { lower: true, strict: true, locale: 'vi' });

export const generateOrderCode = () => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MC${y}${m}${d}${rand}`;
};

export const paginate = (page = 1, limit = 12) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
};

export const getEffectivePrice = (product) =>
  product.SalePrice && product.SalePrice < product.Price
    ? product.SalePrice
    : product.Price;
