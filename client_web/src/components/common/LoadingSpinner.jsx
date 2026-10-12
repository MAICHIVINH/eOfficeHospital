import { useTranslation } from 'react-i18next'

const LoadingSpinner = ({ fullPage = false, size = 'md' }) => {
    const { t } = useTranslation()
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    }

    const spinner = (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-4 border-primary-200 dark:border-primary-900/30 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin`}
            />
        </div>
    )

    if (fullPage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
                <div className="text-center">
                    {spinner}
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">{t('common.labels.loading')}</p>
                </div>
            </div>
        )
    }

    return spinner
}

export default LoadingSpinner
