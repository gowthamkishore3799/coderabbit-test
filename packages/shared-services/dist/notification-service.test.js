"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const notification_service_1 = require("./notification-service");
(0, vitest_1.describe)('NotificationService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        service = new notification_service_1.NotificationService();
    });
    (0, vitest_1.describe)('send()', () => {
        (0, vitest_1.it)('sends a SUCCESS notification and returns an id', () => {
            const id = service.send(notification_service_1.NotificationType.SUCCESS, 'Done', 'Operation completed.');
            (0, vitest_1.expect)(typeof id).toBe('string');
            (0, vitest_1.expect)(id.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('sends an INFO notification', () => {
            service.send(notification_service_1.NotificationType.INFO, 'Info', 'Some info.');
            const notifications = service.getAll();
            (0, vitest_1.expect)(notifications).toHaveLength(1);
            (0, vitest_1.expect)(notifications[0].type).toBe(notification_service_1.NotificationType.INFO);
        });
        (0, vitest_1.it)('sends a WARNING notification', () => {
            service.send(notification_service_1.NotificationType.WARNING, 'Warn', 'Be careful.');
            (0, vitest_1.expect)(service.getAll()[0].type).toBe(notification_service_1.NotificationType.WARNING);
        });
        (0, vitest_1.it)('sends an ERROR notification', () => {
            service.send(notification_service_1.NotificationType.ERROR, 'Error', 'Something failed.');
            (0, vitest_1.expect)(service.getAll()[0].type).toBe(notification_service_1.NotificationType.ERROR);
        });
        (0, vitest_1.it)('creates notification with read=false by default', () => {
            service.send(notification_service_1.NotificationType.INFO, 'Test', 'Message');
            (0, vitest_1.expect)(service.getAll()[0].read).toBe(false);
        });
        (0, vitest_1.it)('creates notification with a timestamp', () => {
            service.send(notification_service_1.NotificationType.SUCCESS, 'Title', 'Message');
            const n = service.getAll()[0];
            (0, vitest_1.expect)(n.timestamp).toBeInstanceOf(Date);
        });
        (0, vitest_1.it)('stores title and message correctly', () => {
            service.send(notification_service_1.NotificationType.SUCCESS, 'My Title', 'My Message');
            const n = service.getAll()[0];
            (0, vitest_1.expect)(n.title).toBe('My Title');
            (0, vitest_1.expect)(n.message).toBe('My Message');
        });
        (0, vitest_1.it)('generates unique ids for each notification', () => {
            const id1 = service.send(notification_service_1.NotificationType.INFO, 'T1', 'M1');
            const id2 = service.send(notification_service_1.NotificationType.INFO, 'T2', 'M2');
            (0, vitest_1.expect)(id1).not.toBe(id2);
        });
        (0, vitest_1.it)('accumulates multiple notifications', () => {
            service.send(notification_service_1.NotificationType.INFO, 'A', 'msg');
            service.send(notification_service_1.NotificationType.SUCCESS, 'B', 'msg');
            service.send(notification_service_1.NotificationType.ERROR, 'C', 'msg');
            (0, vitest_1.expect)(service.getAll()).toHaveLength(3);
        });
        (0, vitest_1.it)('logs to console when sending', () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
            service.send(notification_service_1.NotificationType.SUCCESS, 'Title', 'Message');
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)('notifies listeners when a notification is sent', () => {
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.send(notification_service_1.NotificationType.INFO, 'Hello', 'World');
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(listener.mock.calls[0][0].title).toBe('Hello');
        });
    });
    (0, vitest_1.describe)('getAll()', () => {
        (0, vitest_1.it)('returns empty array when no notifications sent', () => {
            (0, vitest_1.expect)(service.getAll()).toEqual([]);
        });
        (0, vitest_1.it)('returns a copy (immutable)', () => {
            service.send(notification_service_1.NotificationType.INFO, 'T', 'M');
            const all1 = service.getAll();
            const all2 = service.getAll();
            (0, vitest_1.expect)(all1).not.toBe(all2);
        });
        (0, vitest_1.it)('mutation of returned array does not affect internal state', () => {
            service.send(notification_service_1.NotificationType.INFO, 'T', 'M');
            const all = service.getAll();
            all.splice(0, 1);
            (0, vitest_1.expect)(service.getAll()).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('getUnread()', () => {
        (0, vitest_1.it)('returns all notifications initially (all unread)', () => {
            service.send(notification_service_1.NotificationType.INFO, 'A', 'msg');
            service.send(notification_service_1.NotificationType.SUCCESS, 'B', 'msg');
            (0, vitest_1.expect)(service.getUnread()).toHaveLength(2);
        });
        (0, vitest_1.it)('returns empty array when all are read', () => {
            service.send(notification_service_1.NotificationType.INFO, 'A', 'msg');
            service.markAllAsRead();
            (0, vitest_1.expect)(service.getUnread()).toHaveLength(0);
        });
        (0, vitest_1.it)('returns only unread notifications after marking some read', () => {
            const id1 = service.send(notification_service_1.NotificationType.INFO, 'A', 'msg');
            service.send(notification_service_1.NotificationType.SUCCESS, 'B', 'msg');
            service.markAsRead(id1);
            (0, vitest_1.expect)(service.getUnread()).toHaveLength(1);
            (0, vitest_1.expect)(service.getUnread()[0].title).toBe('B');
        });
        (0, vitest_1.it)('returns empty array when no notifications sent', () => {
            (0, vitest_1.expect)(service.getUnread()).toEqual([]);
        });
    });
    (0, vitest_1.describe)('markAsRead()', () => {
        (0, vitest_1.it)('marks an existing notification as read', () => {
            const id = service.send(notification_service_1.NotificationType.INFO, 'Test', 'Message');
            const result = service.markAsRead(id);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(service.getAll()[0].read).toBe(true);
        });
        (0, vitest_1.it)('returns false for a non-existent notification id', () => {
            (0, vitest_1.expect)(service.markAsRead('non-existent-id')).toBe(false);
        });
        (0, vitest_1.it)('does not affect other notifications', () => {
            const id1 = service.send(notification_service_1.NotificationType.INFO, 'A', 'msg');
            service.send(notification_service_1.NotificationType.INFO, 'B', 'msg');
            service.markAsRead(id1);
            const all = service.getAll();
            (0, vitest_1.expect)(all.find(n => n.id === id1)?.read).toBe(true);
            (0, vitest_1.expect)(all[1].read).toBe(false);
        });
        (0, vitest_1.it)('is idempotent — marking already-read notification returns true', () => {
            const id = service.send(notification_service_1.NotificationType.SUCCESS, 'T', 'M');
            service.markAsRead(id);
            const result = service.markAsRead(id);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(service.getAll()[0].read).toBe(true);
        });
    });
    (0, vitest_1.describe)('markAllAsRead()', () => {
        (0, vitest_1.it)('marks all notifications as read', () => {
            service.send(notification_service_1.NotificationType.INFO, 'A', 'msg');
            service.send(notification_service_1.NotificationType.SUCCESS, 'B', 'msg');
            service.markAllAsRead();
            service.getAll().forEach(n => (0, vitest_1.expect)(n.read).toBe(true));
        });
        (0, vitest_1.it)('does nothing when there are no notifications', () => {
            (0, vitest_1.expect)(() => service.markAllAsRead()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('subscribe()', () => {
        (0, vitest_1.it)('invokes listener for each sent notification', () => {
            const listener = vitest_1.vi.fn();
            service.subscribe(listener);
            service.send(notification_service_1.NotificationType.INFO, 'T1', 'M1');
            service.send(notification_service_1.NotificationType.INFO, 'T2', 'M2');
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('returns an unsubscribe function that stops future callbacks', () => {
            const listener = vitest_1.vi.fn();
            const unsubscribe = service.subscribe(listener);
            service.send(notification_service_1.NotificationType.INFO, 'First', 'msg');
            unsubscribe();
            service.send(notification_service_1.NotificationType.INFO, 'Second', 'msg');
            (0, vitest_1.expect)(listener).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('supports multiple listeners', () => {
            const l1 = vitest_1.vi.fn();
            const l2 = vitest_1.vi.fn();
            service.subscribe(l1);
            service.subscribe(l2);
            service.send(notification_service_1.NotificationType.SUCCESS, 'T', 'M');
            (0, vitest_1.expect)(l1).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(l2).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('passes the validated notification to the listener', () => {
            let received = null;
            service.subscribe(n => { received = n; });
            service.send(notification_service_1.NotificationType.ERROR, 'Oops', 'Something broke');
            (0, vitest_1.expect)(received).not.toBeNull();
            (0, vitest_1.expect)(received.type).toBe(notification_service_1.NotificationType.ERROR);
            (0, vitest_1.expect)(received.title).toBe('Oops');
            (0, vitest_1.expect)(received.read).toBe(false);
        });
    });
    (0, vitest_1.describe)('clear()', () => {
        (0, vitest_1.it)('removes all notifications', () => {
            service.send(notification_service_1.NotificationType.INFO, 'A', 'msg');
            service.send(notification_service_1.NotificationType.SUCCESS, 'B', 'msg');
            service.clear();
            (0, vitest_1.expect)(service.getAll()).toHaveLength(0);
        });
        (0, vitest_1.it)('allows new notifications after clearing', () => {
            service.send(notification_service_1.NotificationType.INFO, 'Before', 'msg');
            service.clear();
            service.send(notification_service_1.NotificationType.SUCCESS, 'After', 'msg');
            (0, vitest_1.expect)(service.getAll()).toHaveLength(1);
            (0, vitest_1.expect)(service.getAll()[0].title).toBe('After');
        });
        (0, vitest_1.it)('logs to console when clearing', () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
            service.clear();
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
(0, vitest_1.describe)('NotificationType enum', () => {
    (0, vitest_1.it)('has INFO value', () => {
        (0, vitest_1.expect)(notification_service_1.NotificationType.INFO).toBe('info');
    });
    (0, vitest_1.it)('has WARNING value', () => {
        (0, vitest_1.expect)(notification_service_1.NotificationType.WARNING).toBe('warning');
    });
    (0, vitest_1.it)('has ERROR value', () => {
        (0, vitest_1.expect)(notification_service_1.NotificationType.ERROR).toBe('error');
    });
    (0, vitest_1.it)('has SUCCESS value', () => {
        (0, vitest_1.expect)(notification_service_1.NotificationType.SUCCESS).toBe('success');
    });
});
(0, vitest_1.describe)('NotificationSchema', () => {
    (0, vitest_1.it)('accepts a valid notification object', () => {
        const result = notification_service_1.NotificationSchema.safeParse({
            id: 'abc123',
            type: notification_service_1.NotificationType.INFO,
            title: 'Hello',
            message: 'World',
            timestamp: new Date(),
            read: false,
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects empty title', () => {
        const result = notification_service_1.NotificationSchema.safeParse({
            id: 'abc',
            type: notification_service_1.NotificationType.INFO,
            title: '',
            message: 'msg',
            timestamp: new Date(),
            read: false,
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects empty message', () => {
        const result = notification_service_1.NotificationSchema.safeParse({
            id: 'abc',
            type: notification_service_1.NotificationType.INFO,
            title: 'title',
            message: '',
            timestamp: new Date(),
            read: false,
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects invalid notification type', () => {
        const result = notification_service_1.NotificationSchema.safeParse({
            id: 'abc',
            type: 'unknown_type',
            title: 'title',
            message: 'message',
            timestamp: new Date(),
            read: false,
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects non-boolean read field', () => {
        const result = notification_service_1.NotificationSchema.safeParse({
            id: 'abc',
            type: notification_service_1.NotificationType.INFO,
            title: 'T',
            message: 'M',
            timestamp: new Date(),
            read: 'yes',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
//# sourceMappingURL=notification-service.test.js.map