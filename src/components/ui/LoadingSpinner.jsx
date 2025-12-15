const LoadingSpinner = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-t border-b',
    md: 'h-8 w-8 border-t-2 border-b-2',
    lg: 'h-12 w-12 border-t-2 border-b-2'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-[#a4fc3c]`}></div>
      {text && <span className="text-gray-400 text-sm">{text}</span>}
    </div>
  )
}

export default LoadingSpinner
