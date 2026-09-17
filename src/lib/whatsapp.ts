export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppLink(phone: string, message: string) {
  return `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string, message: string) {
  window.open(buildWhatsAppLink(phone, message), "_blank");
}
