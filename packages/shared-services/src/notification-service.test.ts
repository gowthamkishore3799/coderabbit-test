import {
  NotificationService,
  NotificationType,
  NotificationSchema,
  type Notification,
} from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('send()', () => {
    it('creates and stores a notification, returning a string id', () => {
      const id = service.send(NotificationType.SUCCESS, 'Title', 'Message');

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);

      const all = service.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(id);
    });

    it('stores the correct type, title, and message', () => {
      service.send(NotificationType.ERROR, 'Oops', 'Something went wrong');

      const n = service.getAll()[0];
      expect(n.type).toBe(NotificationType.ERROR);
      expect(n.title).toBe('Oops');
      expect(n.message).toBe('Something went wrong');
    });

    it('initialises new notifications as unread', () => {
      service.send(NotificationType.INFO, 'Hello', 'World');

      expect(service.getAll()[0].read).toBe(false);
    });

    it('sets a timestamp on newly created notifications', () => {
      const before = new Date();
      service.send(NotificationType.WARNING, 'Warn', 'Watch out');
      const after = new Date();

      const ts = service.getAll()[0].timestamp;
      expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('generates unique ids for different notifications', () => {
      const id1 = service.send(NotificationType.INFO, 'First', 'Msg1');
      const id2 = service.send(NotificationType.INFO, 'Second', 'Msg2');

      expect(id1).not.toBe(id2);
    });

    it('supports all four notification types', () => {
      service.send(NotificationType.INFO, 'Info', 'i');
      service.send(NotificationType.WARNING, 'Warning', 'w');
      service.send(NotificationType.ERROR, 'Error', 'e');
      service.send(NotificationType.SUCCESS, 'Success', 's');

      const types = service.getAll().map(n => n.type);
      expect(types).toContain(NotificationType.INFO);
      expect(types).toContain(NotificationType.WARNING);
      expect(types).toContain(NotificationType.ERROR);
      expect(types).toContain(NotificationType.SUCCESS);
    });
  });

  describe('getAll()', () => {
    it('returns empty array when no notifications have been sent', () => {
      expect(service.getAll()).toEqual([]);
    });

    it('returns a defensive copy (not the internal array)', () => {
      service.send(NotificationType.INFO, 'Hi', 'Hello');
      const copy = service.getAll();
      copy.push({} as Notification);

      expect(service.getAll()).toHaveLength(1);
    });

    it('returns notifications in insertion order', () => {
      service.send(NotificationType.INFO, 'First', 'f');
      service.send(NotificationType.SUCCESS, 'Second', 's');

      const all = service.getAll();
      expect(all[0].title).toBe('First');
      expect(all[1].title).toBe('Second');
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications as unread initially', () => {
      service.send(NotificationType.INFO, 'A', 'a');
      service.send(NotificationType.INFO, 'B', 'b');

      expect(service.getUnread()).toHaveLength(2);
    });

    it('excludes notifications that have been marked as read', () => {
      const id = service.send(NotificationType.INFO, 'A', 'a');
      service.send(NotificationType.INFO, 'B', 'b');
      service.markAsRead(id);

      const unread = service.getUnread();
      expect(unread).toHaveLength(1);
      expect(unread[0].title).toBe('B');
    });

    it('returns empty array when all notifications are read', () => {
      service.send(NotificationType.INFO, 'A', 'a');
      service.markAllAsRead();

      expect(service.getUnread()).toHaveLength(0);
    });
  });

  describe('markAsRead()', () => {
    it('marks the correct notification as read and returns true', () => {
      const id = service.send(NotificationType.SUCCESS, 'Done', 'Complete');
      const result = service.markAsRead(id);

      expect(result).toBe(true);
      const n = service.getAll().find(n => n.id === id);
      expect(n?.read).toBe(true);
    });

    it('returns false for a non-existent id', () => {
      expect(service.markAsRead('nonexistent-id')).toBe(false);
    });

    it('does not affect other notifications when marking one as read', () => {
      const id1 = service.send(NotificationType.INFO, 'One', '1');
      service.send(NotificationType.INFO, 'Two', '2');
      service.markAsRead(id1);

      const unread = service.getUnread();
      expect(unread).toHaveLength(1);
      expect(unread[0].title).toBe('Two');
    });

    it('is idempotent — marking already-read notification returns true', () => {
      const id = service.send(NotificationType.INFO, 'Test', 't');
      service.markAsRead(id);
      const result = service.markAsRead(id);

      expect(result).toBe(true);
      expect(service.getAll()[0].read).toBe(true);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all pending notifications as read', () => {
      service.send(NotificationType.INFO, 'A', 'a');
      service.send(NotificationType.WARNING, 'B', 'b');
      service.send(NotificationType.ERROR, 'C', 'c');
      service.markAllAsRead();

      service.getAll().forEach(n => expect(n.read).toBe(true));
    });

    it('is a no-op when there are no notifications', () => {
      expect(() => service.markAllAsRead()).not.toThrow();
    });
  });

  describe('subscribe()', () => {
    it('invokes the listener when a notification is sent', () => {
      const listener = jest.fn();
      service.subscribe(listener);

      service.send(NotificationType.INFO, 'Hello', 'World');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].title).toBe('Hello');
    });

    it('supports multiple listeners', () => {
      const l1 = jest.fn();
      const l2 = jest.fn();
      service.subscribe(l1);
      service.subscribe(l2);

      service.send(NotificationType.INFO, 'Broadcast', 'msg');

      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });

    it('stops invoking listener after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();

      service.send(NotificationType.INFO, 'After unsub', 'msg');

      expect(listener).not.toHaveBeenCalled();
    });

    it('passes the validated notification object to the listener', () => {
      let received: Notification | null = null;
      service.subscribe(n => { received = n; });

      service.send(NotificationType.SUCCESS, 'Check', 'Validate me');

      expect(received).not.toBeNull();
      expect((received as unknown as Notification).type).toBe(NotificationType.SUCCESS);
      expect((received as unknown as Notification).read).toBe(false);
    });
  });

  describe('clear()', () => {
    it('removes all stored notifications', () => {
      service.send(NotificationType.INFO, 'A', 'a');
      service.send(NotificationType.INFO, 'B', 'b');
      service.clear();

      expect(service.getAll()).toHaveLength(0);
    });

    it('allows sending notifications again after clearing', () => {
      service.send(NotificationType.INFO, 'Old', 'o');
      service.clear();
      service.send(NotificationType.INFO, 'New', 'n');

      expect(service.getAll()).toHaveLength(1);
      expect(service.getAll()[0].title).toBe('New');
    });
  });
});

describe('NotificationSchema', () => {
  const validNotification = {
    id: 'abc123',
    type: NotificationType.INFO,
    title: 'Test Title',
    message: 'Test message',
    timestamp: new Date(),
    read: false,
  };

  it('accepts a fully valid notification', () => {
    expect(() => NotificationSchema.parse(validNotification)).not.toThrow();
  });

  it('rejects a notification with empty title', () => {
    expect(() =>
      NotificationSchema.parse({ ...validNotification, title: '' })
    ).toThrow();
  });

  it('rejects a notification with empty message', () => {
    expect(() =>
      NotificationSchema.parse({ ...validNotification, message: '' })
    ).toThrow();
  });

  it('rejects an invalid notification type', () => {
    expect(() =>
      NotificationSchema.parse({ ...validNotification, type: 'critical' })
    ).toThrow();
  });

  it('rejects a notification missing required fields', () => {
    expect(() =>
      NotificationSchema.parse({ id: 'x', type: NotificationType.INFO })
    ).toThrow();
  });
});