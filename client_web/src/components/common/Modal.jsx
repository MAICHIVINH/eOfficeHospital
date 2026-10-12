import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    // Handle Escape key to close modal
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal Container */}
                <div className={`relative bg-white dark:bg-gray-950 rounded-2xl shadow-2xl ${maxWidth} w-full overflow-hidden transition-all transform animate-in fade-in zoom-in duration-200 border border-transparent dark:border-gray-800`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default Modal
