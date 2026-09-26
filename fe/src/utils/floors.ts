export function getFloorsDescending(count: number): number[] {
  return Array.from({ length: count }, (_, i) => count - i);
}

export function getFloorsAscending(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}