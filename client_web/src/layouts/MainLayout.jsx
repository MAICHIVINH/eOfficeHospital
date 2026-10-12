import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const MainLayout = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Header onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)} isMobileOpen={isMobileOpen} />

                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-5">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default MainLayout
