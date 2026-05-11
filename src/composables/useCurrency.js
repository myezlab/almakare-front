/**
 * Composable for currency formatting (EUR only)
 */
export function useCurrency() {
  /**
   * Format a number as EUR currency
   * @param {number} value - The value to format
   * @param {object} options - Additional Intl.NumberFormat options
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (value, options = {}) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options
    }).format(value)
  }

  return {
    formatCurrency
  }
}
