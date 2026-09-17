const moneyUSD = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUSD(value: number) {
  return moneyUSD.format(value);
}

const moneyARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatARS(value: number) {
  return moneyARS.format(value);
}
