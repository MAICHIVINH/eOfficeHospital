import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../store/ThemeContext';

const ThemeToggle = () => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all duration-200 
                     bg-gray-100 hover:bg-gray-200 text-gray-600
                     dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300
                     border border-gray-200 dark:border-gray-700"
            title={theme === 'light' ? t('common.tooltips.switchToDark') : t('common.tooltips.switchToLight')}
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </button>
    );
};

export default ThemeToggle;
