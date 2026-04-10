"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.NotificationSchema = exports.NotificationType = void 0;
const zod_1 = require("zod");
var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "info";
    NotificationType["WARNING"] = "warning";
    NotificationType["ERROR"] = "error";
    NotificationType["SUCCESS"] = "success";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
exports.NotificationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.nativeEnum(NotificationType),
    title: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    timestamp: zod_1.z.date(),
    read: zod_1.z.boolean(),
});
class NotificationService {
    constructor() {
        this.notifications = [];
        this.listeners = [];
    }
    send(type, title, message) {
        const notification = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            title,
            message,
            timestamp: new Date(),
            read: false
        };
        const validatedNotification = exports.NotificationSchema.parse(notification);
        this.notifications.push(validatedNotification);
        this.listeners.forEach(listener => listener(validatedNotification));
        console.log(`[Notification] ${type.toUpperCase()}: ${title}`);
        return notification.id;
    }
    getAll() {
        return [...this.notifications];
    }
    getUnread() {
        return this.notifications.filter(n => !n.read);
    }
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            return true;
        }
        return false;
    }
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
    }
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    clear() {
        this.notifications = [];
        console.log('[Notification] Cleared all notifications');
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification-service.js.map