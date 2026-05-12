import { z } from 'zod';

/**
 * Enumeration of supported notification severity types.
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

/**
 * Represents a single notification with an identifier, type, title, message,
 * timestamp, and read status.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

/**
 * Zod schema for runtime validation of Notification objects.
 * Enforces non-empty title/message strings, a valid NotificationType enum value,
 * a Date timestamp, and a boolean read flag.
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
 * In-memory notification service for sending, retrieving, and managing notifications,
 * with support for subscriber callbacks.
 */
export class NotificationService {
  /** Internal array storing all current notifications. */
  private notifications: Notification[] = [];

  /** Registered listener callbacks to be invoked whenever a notification is sent. */
  private listeners: ((notification: Notification) => void)[] = [];

  /**
   * Creates, validates, stores, and broadcasts a new notification.
   *
   * @param type - The severity type of the notification.
   * @param title - A short title for the notification.
   * @param message - The notification body message.
   * @returns The unique ID of the created notification.
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
   * @returns An array of all Notification objects.
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Returns all notifications that have not yet been marked as read.
   *
   * @returns An array of unread Notification objects.
   */
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Marks a notification as read by its ID.
   *
   * @param id - The ID of the notification to mark as read.
   * @returns `true` if the notification was found and updated, otherwise `false`.
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
   * Registers a listener callback to be called whenever a new notification is sent.
   *
   * @param listener - A callback that receives each new Notification.
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
   * Removes all stored notifications and logs the action.
   */
  clear(): void {
    this.notifications = [];
    console.log('[Notification] Cleared all notifications');
  }
}
