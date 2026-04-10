import { z } from 'zod';
export declare enum NotificationType {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    SUCCESS = "success"
}
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<typeof NotificationType>;
    title: z.ZodString;
    message: z.ZodString;
    timestamp: z.ZodDate;
    read: z.ZodBoolean;
}, z.core.$strip>;
export declare class NotificationService {
    private notifications;
    private listeners;
    send(type: NotificationType, title: string, message: string): string;
    getAll(): Notification[];
    getUnread(): Notification[];
    markAsRead(id: string): boolean;
    markAllAsRead(): void;
    subscribe(listener: (notification: Notification) => void): () => void;
    clear(): void;
}
//# sourceMappingURL=notification-service.d.ts.map