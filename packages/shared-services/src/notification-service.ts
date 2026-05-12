import { z } from 'zod';

/**
 * Enumeration of notification severity/category types.
 */
export enum NotificationType {
  /** Informational notification requiring no action. */
  INFO = 'info',
  /** Warning notification indicating a potential issue. */
  WARNING = 'warning',
  /** Error notification indicating a failure or critical issue. */
  ERROR = 'error',
  /** Success notification confirming a completed operation. */
  SUCCESS = 'success'
}

/**
 * Represents a single notification stored by the {@link NotificationService}.
 */
export interface Notification {
  /** Unique identifier for the notification. */
  id: string;
  /** The severity/category type of the notification. */
  type: NotificationType;
  /** Short summary title of the notification. */
  title: string;
  /** Detailed body text of the notification. */
  message: string;
  /** The date and time when the notification was created. */
  timestamp: Date;
  /** Whether the notification has been marked as read. */
  read: boolean;
}

/**
 * Zod schema used to validate {@link Notification} objects at runtime.
 */
export const NotificationSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1),
  message: z.string().min(1),
  timestamp: z.date(),
  read: z.boolean(),
});

/**
 * Service for creating, querying, and managing in-memory notifications.
 */
export class NotificationService {
  /** In-memory store of all notifications. */
  private notifications: Notification[] = [];
  /** Registered listener callbacks invoked whenever a new notification is sent. */
  private listeners: ((notification: Notification) => void)[] = [];

  /**
   * Creates, validates, and stores a new notification, then notifies all subscribers.
   *
   * @param type - The {@link NotificationType} of the notification.
   * @param title - A short title summarising the notification.
   * @param message - The detailed notification message body.
   * @returns The unique identifier of the created notification.
   */
  send(type: NotificationType, title: string, message: string): string {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    };

    const validatedNotification = NotificationSchema.parse(notification);
    this.notifications.push(validatedNotification);

    this.listeners.forEach(listener => listener(validatedNotification));

    console.log(`[Notification] ${type.toUpperCase()}: ${title}`);
    return notification.id;
  }

  /**
   * Returns a shallow copy of all stored notifications.
   *
   * @returns An array of all {@link Notification} objects.
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Returns all notifications that have not yet been marked as read.
   *
   * @returns An array of unread {@link Notification} objects.
   */
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Marks a specific notification as read by its identifier.
   *
   * @param id - The unique identifier of the notification to mark as read.
   * @returns `true` if the notification was found and updated, `false` otherwise.
   */
  markAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * Marks all stored notifications as read.
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  /**
   * Registers a listener callback that is invoked whenever a new notification is sent.
   *
   * @param listener - A callback that receives each new {@link Notification}.
   * @returns An unsubscribe function that removes the listener when called.
   */
  subscribe(listener: (notification: Notification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Removes all stored notifications from memory.
   */
  clear(): void {
    this.notifications = [];
    console.log('[Notification] Cleared all notifications');
  }
}