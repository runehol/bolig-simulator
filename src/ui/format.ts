export const formatMetricValue = (value: number, decimals = 0) =>
  new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
