/**
 * Reusable QualityBadge component for displaying setup quality indicators (A, B, C)
 * @param {string} quality - Quality grade ('A', 'B', or 'C')
 * @param {string} size - Size variant: 'sm' (default) or 'md'
 * @param {boolean} showLabel - Whether to show "Grade" prefix (default: false)
 */
function QualityBadge({ quality, size = 'sm', showLabel = false }) {
  if (!quality) return null

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  const colorClasses = {
    A: 'bg-[#a4fc3c]/20 text-[#a4fc3c]',
    B: 'bg-yellow-500/20 text-yellow-400',
    C: 'bg-red-500/20 text-red-400'
  }

  const displayText = showLabel ? `Grade ${quality}` : quality

  return (
    <span className={`${sizeClasses[size]} rounded font-semibold ${colorClasses[quality] || colorClasses.C}`}>
      {displayText}
    </span>
  )
}

export default QualityBadge
