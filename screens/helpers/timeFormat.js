export const getLocale = (language) =>
  language === 'spanish' ? 'es-ES' : 'en-US';

const toDate = (value) => {
  if (value instanceof Date) {
    // Check if date is valid
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const formatDate = (value, language, options = {}) => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString(getLocale(language), options);
};

export const formatTime = (value, language, options = {}) => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleTimeString(getLocale(language), options);
};
  