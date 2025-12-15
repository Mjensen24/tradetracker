import { format, parseISO } from 'date-fns'

/**
 * Format date in short format (e.g., "Jan 15, 2024")
 * Used for tables, lists, and compact displays
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDateShort(date) {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d, yyyy')
}

/**
 * Format date in long format (e.g., "Monday, January 15, 2024")
 * Used for detail views and modal displays
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDateLong(date) {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'EEEE, MMMM d, yyyy')
}

/**
 * Format date in chart format (e.g., "Jan 15")
 * Used for chart labels and compact date displays
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDateChart(date) {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d')
}

/**
 * Format currency value with dollar sign and 2 decimal places
 * @param {number} value - Currency value to format
 * @param {boolean} showSign - Whether to show + prefix for positive values
 * @returns {string} Formatted currency string (e.g., "$123.45" or "+$123.45")
 */
export function formatCurrency(value, showSign = false) {
  if (value === null || value === undefined || isNaN(value)) return '$0.00'
  const sign = showSign && value >= 0 ? '+' : ''
  return `${sign}$${value.toFixed(2)}`
}

/**
 * Format number with locale-specific formatting (e.g., "1,234")
 * Used for shares, counts, and large numbers
 * @param {number} value - Number to format
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return value.toLocaleString(undefined, options)
}

/**
 * Format percentage value
 * @param {number} value - Percentage value (e.g., 25.5 for 25.5%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string (e.g., "25.5%")
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format cents value (price difference per share)
 * @param {number} value - Cents value
 * @param {boolean} showSign - Whether to show + prefix for positive values
 * @returns {string} Formatted cents string (e.g., "+0.25¢" or "-0.15¢")
 */
export function formatCents(value, showSign = false) {
  if (value === null || value === undefined || isNaN(value)) return '0.00¢'
  const sign = showSign && value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}¢`
}
