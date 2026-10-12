import React from 'react'
import { withTranslation } from 'react-i18next'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)
        this.setState({
            error,
            errorInfo,
        })
    }

    render() {
        const { t } = this.props
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                            {t('common.messages.error')}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 text-center">
                            {t('common.messages.saveFailed')}
                        </p>
                        {this.state.error && (
                            <details className="mt-4 text-xs text-gray-600">
                                <summary className="cursor-pointer font-medium">{t('auditLogs.details')}</summary>
                                <pre className="mt-2 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 w-full btn btn-primary"
                        >
                            {t('common.actions.refresh')}
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default withTranslation()(ErrorBoundary)
