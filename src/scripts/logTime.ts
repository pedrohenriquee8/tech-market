export function logTime(
  label: string,
  startTime: number,
  decimalPlaces: number = 2
) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(decimalPlaces);
  console.log(`${label} completed in ${duration} seconds.`);
}
