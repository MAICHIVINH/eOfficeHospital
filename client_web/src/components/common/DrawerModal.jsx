import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * DrawerModal — slides in from the right side of the screen, full viewport height.
 * Props:
 *   isOpen  : boolean
 *   onClose : () => void
 *   title   : string
 *   width   : Tailwind width class, e.g. 'w-full md:w-[80vw] lg:w-[75vw]' (default)
 *   children: ReactNode
 */
const DrawerModal = ({
    isOpen,
    onClose,
    title,
    width = 'w-full md:w-[80vw] lg:w-[75vw]',
    children,
}) => {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            window.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            window.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="flex-1 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={`
                    ${width}
                    h-screen flex flex-col
                    bg-white dark:bg-gray-950
                    border-l border-gray-200 dark:border-gray-800
                    shadow-2xl
                    drawer-slide-in
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight truncate pr-4">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}

export default DrawerModal
