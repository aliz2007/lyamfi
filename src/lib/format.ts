export const mad = (v: number, digits = 2) =>
  new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v) + " MAD";

export const pct = (v: number, digits = 2) =>
  `${v > 0 ? "+" : ""}${v.toFixed(digits).replace(".", ",")} %`;

export const compact = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(".", ",")} Md MAD`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} M MAD`;
  return `${v}`;
};

export const num = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined ? "—" : v.toFixed(digits).replace(".", ",");
