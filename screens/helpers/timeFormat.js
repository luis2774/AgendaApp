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

export const formatTime = (value, language) => {
  const date = toDate(value);
  if (!date) return '';
  // This ignores the 'language' variable and forces US-style 12h time formatting
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const getTimeUntil = (targetDate, language) => {
  const now = new Date();
  const diffInMs = targetDate - now;
  
  if (diffInMs < 0) return "Started"; 

  const mins = Math.floor(diffInMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days}d`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};