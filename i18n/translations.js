import english from "./english";
import spanish from "./spanish";

export const translations = {
  english,
  spanish,
};

export const getT = (key, lang = "english") => {
  return translations[lang][key] || key;
};
