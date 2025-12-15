/**
 * Reusable EmptyState component for displaying empty states across the application
 * @param {React.ReactNode} icon - Icon component to display
 * @param {string} title - Main title text
 * @param {string} message - Description message
 * @param {React.ReactNode} action - Optional action button or element
 */
function EmptyState({ icon, title, message, action }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg p-6 text-center border border-gray-800">
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {message && <p className="text-gray-300">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
