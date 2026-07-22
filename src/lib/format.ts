function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function changeClass(value: number) {
  if (value > 0) return "text-up";
  if (value < 0) return "text-down";
  return "text-ink-soft";
}

function formatChange(absolute: number, percent: number) {
  const sign = absolute > 0 ? "+" : "";
  return {
    absolute: `${sign}${formatMoney(absolute)}`,
    percent: `${sign}${percent.toFixed(2)}%`,
  };
}

export {
  changeClass,
  formatChange,
  formatCompact,
  formatMoney,
  formatNumber,
};
