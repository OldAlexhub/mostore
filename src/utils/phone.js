export const PHONE_DIGIT_COUNT = 11;

export const normalizePhoneNumber = (value = '') =>
  String(value || '')
    .replace(/[^0-9+]/g, '')
    .replace(/^\+/, '');

export const clampPhoneNumber = (value = '') => {
  const normalized = normalizePhoneNumber(value);
  return normalized.slice(0, PHONE_DIGIT_COUNT);
};

export const isValidPhoneNumber = (value = '') =>
  normalizePhoneNumber(value).length === PHONE_DIGIT_COUNT;
