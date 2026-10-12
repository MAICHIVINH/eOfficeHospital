import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes'
import ErrorBoundary from './components/common/ErrorBoundary'
import { ThemeProvider } from './store/ThemeContext'
import { SidebarProvider } from './store/SidebarContext'
import { NotificationProvider } from './store/NotificationContext'

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <SidebarProvider>
                    <NotificationProvider>
                        <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                            <AppRoutes />
                            <Toaster
                                position="top-right"
                                containerStyle={{
                                    top: 12,
                                    right: 12,
                                }}
                                toastOptions={{
                                    duration: 3000,
                                    style: {
                                        background: 'rgba(255, 255, 255, 0.85)',
                                        color: '#1f2937',
                                        backdropFilter: 'blur(8px)',
                                        WebkitBackdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        maxWidth: '280px',
                                        fontSize: '13px',
                                        padding: '10px 14px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                        borderRadius: '12px',
                                        wordBreak: 'break-word',
                                    },
                                    success: {
                                        iconTheme: {
                                            primary: '#10b981',
                                            secondary: '#fff',
                                        },
                                    },
                                    error: {
                                        iconTheme: {
                                            primary: '#ef4444',
                                            secondary: '#fff',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </NotificationProvider>
                </SidebarProvider>
            </ThemeProvider>
        </ErrorBoundary>
    )
}

export default App
