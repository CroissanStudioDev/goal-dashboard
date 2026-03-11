/**
 * Format number as currency
 */
export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  }
  
  return `${formatted} ${symbols[currency] || currency}`
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}
