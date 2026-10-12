import { STATUS_COLORS } from '../../utils/constants'

const Badge = ({ children, variant = 'gray', className = 'py-0' }) => {
    const variantClasses = {
        success: 'badge-success dark:bg-green-900/30 dark:text-green-400',
        warning: 'badge-warning dark:bg-yellow-900/30 dark:text-yellow-400',
        danger: 'badge-danger dark:bg-red-900/30 dark:text-red-400',
        info: 'badge-info dark:bg-blue-900/30 dark:text-blue-400',
        primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        gray: 'badge-gray dark:bg-gray-800 dark:text-gray-400',
    }

    return (
        <span className={`badge ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    )
}

export default Badge
