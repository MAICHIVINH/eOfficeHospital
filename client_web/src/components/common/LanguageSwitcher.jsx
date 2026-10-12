import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LanguageSwitcher = () => {
    const { i18n } = useTranslation()

    const toggleLanguage = () => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi'
        i18n.changeLanguage(newLang)
    }

    const currentLanguage = i18n.language === 'vi' ? 'VI' : 'EN'

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
        >
            <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {currentLanguage}
            </span>
        </button>
    )
}

export default LanguageSwitcher
