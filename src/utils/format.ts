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

function changeClass(value: number | null | undefined) {
  if (value == null) return "text-dash-muted";
  if (value > 0) return "text-dash-up";
  if (value < 0) return "text-dash-down";
  return "text-dash-muted";
}

function formatChange(
  absolute: number | null | undefined,
  percent: number | null | undefined,
) {
  if (absolute == null || percent == null) {
    return { absolute: "—", percent: "—" };
  }
  const sign = absolute > 0 ? "+" : "";
  return {
    absolute: `${sign}${formatMoney(absolute)}`,
    percent: `${sign}${percent.toFixed(2)}%`,
  };
}

function formatMaybeMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return formatMoney(value);
}

export {
  changeClass,
  formatChange,
  formatCompact,
  formatMaybeMoney,
  formatMoney,
  formatNumber,
};
