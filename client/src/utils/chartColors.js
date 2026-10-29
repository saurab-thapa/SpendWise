const chartVariableNames = [
  "--chart-teal",
  "--chart-navy",
  "--chart-green",
  "--chart-amber",
  "--chart-red",
  "--chart-slate"
];

export function getChartPalette() {
  const styles = window.getComputedStyle(document.documentElement);
  return chartVariableNames.map((name) => styles.getPropertyValue(name).trim());
}

export function getCategoryColor(category) {
  const palette = getChartPalette();
  const categoryHash = Array.from(category.toLowerCase()).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  return palette[categoryHash % palette.length];
}
