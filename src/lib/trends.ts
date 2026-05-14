// Calculate trend between current and previous values
export function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

export function getTrendColor(trend: 'up' | 'down' | 'stable') {
  if (trend === 'up') return 'text-green-600';
  if (trend === 'down') return 'text-red-600';
  return 'text-gray-500';
}

// Store historical data in localStorage
export function getHistoricalData(key: string, currentValue: number): { current: number; previous: number; trend: 'up' | 'down' | 'stable' } {
  const storageKey = `trend_${key}`;
  const previous = localStorage.getItem(storageKey);
  const previousValue = previous ? parseInt(previous) : currentValue;
  
  // Store current for next time
  localStorage.setItem(storageKey, currentValue.toString());
  
  return {
    current: currentValue,
    previous: previousValue,
    trend: calculateTrend(currentValue, previousValue)
  };
}
