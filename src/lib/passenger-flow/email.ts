export const PASSENGER_EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+\-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

export function isValidPassengerEmailInput(value: string) {
  return value === "" || PASSENGER_EMAIL_PATTERN.test(value);
}

export function passengerEmailError(locale: "en" | "am" | "om" | "ar") {
  if (locale === "am") return "በኢሜይል አድራሻዎ ውስጥ የእንግሊዝኛ ፊደላትን ይጠቀሙ፣ ለምሳሌ abebe123@gmail.com፣ ወይም ባዶ ይተዉት።";
  if (locale === "om") return "Teessoo imeelii keessatti qubee Ingiliffaa fayyadami; fakkeenyaaf abebe123@gmail.com, yookaan duwwaa dhiisi.";
  if (locale === "ar") return "استخدم أحرفًا إنجليزية في عنوان البريد، مثل abebe123@gmail.com، أو اتركه فارغًا.";
  return "Use English letters in the email address, for example abebe123@gmail.com, or leave it blank.";
}
