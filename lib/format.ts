export function money(value: number | string) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2
  }).format(Number(value));
}

export function percent(value: number | string) {
  return `${Number(value).toFixed(2)}%`;
}
