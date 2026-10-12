import React from 'react'
import { FileText, ChevronRight, FolderTree, FileQuestion, BookOpen, ScrollText, ClipboardList, Bell, Calendar, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DOCUMENT_TYPES } from '../../utils/constants'

const DocumentTypeTree = ({ selectedType, onTypeSelect }) => {
    const { t } = useTranslation()

    // Map keys to icons for a more visual look
    const typeIcons = {
        DIRECTIVE: <Send size={16} />,
        PROCEDURE: <BookOpen size={16} />,
        DECISION: <FileText size={16} />,
        REPORT: <ClipboardList size={16} />,
        MINUTES: <ScrollText size={16} />,
        NOTIFICATION: <Bell size={16} />,
        PLAN: <Calendar size={16} />,
        PROPOSAL: <FileQuestion size={16} />,
        OTHER: <FolderTree size={16} />,
    }

    const types = Object.keys(DOCUMENT_TYPES)

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden sticky top-4">
            <div className="p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <FolderTree size={14} className="text-primary-500" />
                    {t('documents.documentType')}
                </h3>
            </div>
            
            <div className="p-2">
                <button
                    onClick={() => onTypeSelect('')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        selectedType === ''
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 translate-x-1'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                >
                    <div className={`${selectedType === '' ? 'text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                        <FolderTree size={16} />
                    </div>
                    <span className="flex-1 text-left">{t('common.labels.all')}</span>
                    {selectedType === '' && <ChevronRight size={14} className="animate-pulse" />}
                </button>

                <div className="my-2 px-4">
                    <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
                </div>

                <div className="space-y-1">
                    {types.map((typeKey) => {
                        const isActive = selectedType === typeKey || (selectedType && selectedType.toLowerCase() === typeKey.toLowerCase())
                        // Handle potential PascalCase from enum vs UPPERCASE from constants
                        const normalizedSelectedType = selectedType?.toUpperCase()
                        const isReallyActive = normalizedSelectedType === typeKey

                        return (
                            <button
                                key={typeKey}
                                onClick={() => onTypeSelect(typeKey)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group ${
                                    isReallyActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 translate-x-1'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                                }`}
                            >
                                <div className={`transition-colors duration-300 ${
                                    isReallyActive 
                                        ? 'text-primary-600 dark:text-primary-400' 
                                        : 'text-gray-400 dark:text-gray-600 group-hover:text-primary-500'
                                }`}>
                                    {typeIcons[typeKey] || <FileText size={16} />}
                                </div>
                                <span className="flex-1 text-left line-clamp-1">
                                    {t(`formatters.documentType.${typeKey}`)}
                                </span>
                                {isReallyActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
            
            <div className="p-4 bg-gray-50/30 dark:bg-gray-800/20 border-t border-gray-50 dark:border-gray-800 mt-2">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 italic">
                    <div className="w-1 h-1 rounded-full bg-primary-400"></div>
                    {t('dashboard.clickToSeeDetails')}
                </div>
            </div>
        </div>
    )
}

export default DocumentTypeTree
