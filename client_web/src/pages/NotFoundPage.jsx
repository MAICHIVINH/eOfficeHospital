import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
            <div className="text-center">
                <h1 className="text-9xl font-black text-gray-200 dark:text-gray-900 transform -rotate-12 select-none tracking-tighter">404</h1>
                <p className="mt-4 text-3xl font-bold text-gray-800 dark:text-gray-100 -mt-10">
                    {t('notFound.title')}
                </p>
                <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                    {t('notFound.message')}
                </p>
                <Link to="/dashboard" className="mt-8 inline-flex btn btn-primary py-3 px-8 shadow-xl shadow-primary-600/20">
                    {t('notFound.goHome')}
                </Link>
            </div>
        </div>
    )
}

export default NotFoundPage
