'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const addNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration = 4500) => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map((notif) => (
        <Toast
          key={notif.id}
          notification={notif}
          onClose={() => removeNotification(notif.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

function Toast({ notification, onClose }: ToastProps) {
  const configs = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border border-green-200/60',
      text: 'text-green-900',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border border-red-200/60',
      text: 'text-red-900',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-sky-50',
      border: 'border border-blue-200/60',
      text: 'text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const config = configs[notification.type];
  const IconComponent = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-lg backdrop-blur-sm ${config.bg} ${config.border} anim-slide-in-bottom`}
    >
      <IconComponent className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconColor}`} strokeWidth={1.75} />
      <p className={`text-sm font-medium leading-relaxed flex-1 ${config.text}`}>{notification.message}</p>
      <button
        onClick={onClose}
        className={`ml-2 p-1 transition hover:opacity-50 active:scale-95 ${config.text}`}
        aria-label="Close"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
