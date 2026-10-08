'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'PROJECT_MEMBER_ADDED'
  | 'TASK_DUE_SOON'
  | 'PROJECT_UPDATED'

export type NotificationItem = {
  id: string
  type: NotificationType
  message: string
  actorId?: string
  actorName?: string
  projectId?: string
  projectName?: string
  taskId?: string
  taskTitle?: string
  isRead: boolean
  createdAt: string
}

type NotificationContextValue = {
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (notification: Omit<NotificationItem, 'isRead'> & { isRead?: boolean }) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
}

const NOTIFICATION_STORAGE_KEY = 'taskflow-notifications'
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as NotificationItem[]
        if (Array.isArray(parsed)) {
          setNotifications(parsed)
        } else {
          window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, '[]')
        }
      } catch {
        window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, '[]')
      }
    }

    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications))
  }, [isReady, notifications])

  const addNotification = useCallback((notification: Omit<NotificationItem, 'isRead'> & { isRead?: boolean }) => {
    setNotifications((currentNotifications) => {
      const newNotification: NotificationItem = {
        ...notification,
        isRead: notification.isRead ?? false,
      }

      const unique = currentNotifications.some((item) => item.id === newNotification.id)
      if (unique) {
        return currentNotifications
      }

      return [newNotification, ...currentNotifications]
    })
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, isRead: true })),
    )
  }, [])

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    )
  }, [])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.isRead).length,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [addNotification, deleteNotification, markAllAsRead, markAsRead, notifications],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }

  return context
}
