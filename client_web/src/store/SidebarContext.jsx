import { createContext, useContext, useState, useEffect } from 'react'

const SidebarContext = createContext()

export const SidebarProvider = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar_collapsed')
        return saved === 'true'
    })

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', isCollapsed)
    }, [isCollapsed])

    const toggleSidebar = () => setIsCollapsed(prev => !prev)

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
