import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../hooks/useAuth';
import { notificationApi } from '../api/notificationApi';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [connection, setConnection] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    // Fetch initial notifications
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            const summary = await notificationApi.getSummary();
            setNotifications(summary.recentNotifications || []);
            setUnreadCount(summary.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [user]);

    // Initialize SignalR connection
    useEffect(() => {
        if (!user || !token) return;

        const apiUrl = import.meta.env.VITE_API_URL;
        const hubUrl = (apiUrl && apiUrl !== 'undefined')
            ? `${apiUrl}/hubs/notifications`
            : '/hubs/notifications';

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        setConnection(newConnection);

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, [user, token]);

    // Start connection and listen for notifications
    useEffect(() => {
        if (!connection) return;

        const startConnection = async () => {
            try {
                await connection.start();
                console.log('SignalR Connected');
                setIsConnected(true);

                // Fetch initial notifications after connection
                await fetchNotifications();
            } catch (error) {
                console.error('SignalR Connection Error:', error);
                setIsConnected(false);

                // Retry after 5 seconds
                setTimeout(startConnection, 5000);
            }
        };

        // Listen for incoming notifications
        connection.on('ReceiveNotification', (notification) => {
            console.log('New notification received:', notification);

            // Add to notifications list
            setNotifications(prev => [notification, ...prev].slice(0, 10));
            setUnreadCount(prev => prev + 1);

            const notificationDesktop = new Notification(notification.title, {
                body: notification.message,
                icon: "/tamtrilogo.png",
                data: {
                    url: notification.link,
                },
            });

            notificationDesktop.onclick = (event) => {
                event.preventDefault();
                window.open(notificationDesktop.data.url, "_blank");
            };

            // Show toast notification
            toast.success(notification.title, {
                duration: 4000,
                icon: '🔔',
            });
        });

        /*
        // Listen for User events
        connection.on('UserCreated', (data) => {
            console.log('User created:', data);
            toast.success(data.message, {
                duration: 4000,
                icon: '👤',
            });
        });

        connection.on('UserUpdated', (data) => {
            console.log('User updated:', data);
            toast.info(data.message, {
                duration: 4000,
                icon: '✏️',
            });
        });

        connection.on('UserDeleted', (data) => {
            console.log('User deleted:', data);
            toast.error(data.message, {
                duration: 4000,
                icon: '🗑️',
            });
        });

        // Listen for Department events
        connection.on('DepartmentCreated', (data) => {
            console.log('Department created:', data);
            toast.success(data.message, {
                duration: 4000,
                icon: '🏢',
            });
        });

        connection.on('DepartmentUpdated', (data) => {
            console.log('Department updated:', data);
            toast.info(data.message, {
                duration: 4000,
                icon: '✏️',
            });
        });

        connection.on('DepartmentDeleted', (data) => {
            console.log('Department deleted:', data);
            toast.error(data.message, {
                duration: 4000,
                icon: '🗑️',
            });
        });

        // Listen for Role events
        connection.on('RoleCreated', (data) => {
            console.log('Role created:', data);
            toast.success(data.message, {
                duration: 4000,
                icon: '🛡️',
            });
        });

        connection.on('RoleUpdated', (data) => {
            console.log('Role updated:', data);
            toast.info(data.message, {
                duration: 4000,
                icon: '✏️',
            });
        });

        connection.on('RoleDeleted', (data) => {
            console.log('Role deleted:', data);
            toast.error(data.message, {
                duration: 4000,
                icon: '🗑️',
            });
        });
        */

        connection.onreconnecting(() => {
            console.log('SignalR Reconnecting...');
            setIsConnected(false);
        });

        connection.onreconnected(() => {
            console.log('SignalR Reconnected');
            setIsConnected(true);
            fetchNotifications();
        });

        connection.onclose(() => {
            console.log('SignalR Disconnected');
            setIsConnected(false);
        });

        startConnection();

        return () => {
            connection.off('ReceiveNotification');
            /*
            connection.off('UserCreated');
            connection.off('UserUpdated');
            connection.off('UserDeleted');
            connection.off('DepartmentCreated');
            connection.off('DepartmentUpdated');
            connection.off('DepartmentDeleted');
            connection.off('RoleCreated');
            connection.off('RoleUpdated');
            connection.off('RoleDeleted');
            */
        };
    }, [connection, fetchNotifications]);

    // Mark as read
    const markAsRead = async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            await notificationApi.deleteNotification(notificationId);

            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            // Decrease unread count if the deleted notification was unread
            const deletedNotification = notifications.find(n => n.id === notificationId);
            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const value = {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
