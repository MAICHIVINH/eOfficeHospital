import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * ActionMenu component
 * Group actions into a vertical dots dropdown
 * Uses portal to avoid clipping by parent overflow:hidden (like in ag-grid)
 */
const ActionMenu = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const toggleMenu = (e) => {
        e.stopPropagation();
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const visibleActions = actions.filter(a => !a.hidden).length;
            const estimatedMenuHeight = (visibleActions * 40) + 16; // Estimate: ~40px per item + padding
            
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldOpenUpwards = spaceBelow < estimatedMenuHeight + 20;

            setCoords({
                top: shouldOpenUpwards 
                    ? rect.top + window.scrollY - estimatedMenuHeight - 4 
                    : rect.bottom + window.scrollY + 4,
                left: rect.right + window.scrollX - 192 // 192 is menu width (w-48)
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && 
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const menuContent = (
        <div
            ref={menuRef}
            className="fixed z-[9999] w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="py-1">
                {actions.map((action, index) => {
                    if (action.hidden) return null;
                    
                    return (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!action.disabled) {
                                    action.onClick();
                                    setIsOpen(false);
                                }
                            }}
                            disabled={action.disabled}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                                action.disabled
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/50'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
                            }`}
                            title={action.title}
                        >
                            <span className={`${action.disabled ? 'opacity-40' : action.iconColor || 'text-gray-500 dark:text-gray-400'}`}>
                                {action.icon}
                            </span>
                            <span className="font-semibold">{action.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex items-center justify-center">
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isOpen 
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 shadow-inner' 
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
                <MoreVertical size={20} strokeWidth={2.5} />
            </button>
            {isOpen && createPortal(menuContent, document.body)}
        </div>
    );
};

export default ActionMenu;
