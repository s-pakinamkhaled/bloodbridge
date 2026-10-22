let lang = 'en'

export function setActiveLang(next) {
  lang = next === 'ar' ? 'ar' : 'en'
}

export function getActiveLang() {
  return lang
}

export function dateLocale() {
  return lang === 'ar' ? 'ar-EG' : 'en-GB'
}
