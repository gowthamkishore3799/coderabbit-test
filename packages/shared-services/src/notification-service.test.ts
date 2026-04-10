import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationService, NotificationType, NotificationSchema } from './notification-service.ts';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('send()', () => {
    it('sends a SUCCESS notification and returns a string id', () => {
      const id = service.send(NotificationType.SUCCESS, 'Welcome!', 'You have successfully logged in.');
      assert.equal(typeof id, 'string');
      assert.ok(id.length > 0);
    });

    it('sends an INFO notification', () => {
      service.send(NotificationType.INFO, 'New Feature', 'Check out our new analytics dashboard!');
      const all = service.getAll();
      assert.equal(all.length, 1);
      assert.equal(all[0].type, NotificationType.INFO);
      assert.equal(all[0].title, 'New Feature');
      assert.equal(all[0].message, 'Check out our new analytics dashboard!');
    });

    it('sends a WARNING notification', () => {
      service.send(NotificationType.WARNING, 'Warning', 'Your session is about to expire.');
      const all = service.getAll();
      assert.equal(all[0].type, NotificationType.WARNING);
    });

    it('sends an ERROR notification', () => {
      service.send(NotificationType.ERROR, 'Error', 'Something went wrong.');
      const all = service.getAll();
      assert.equal(all[0].type, NotificationType.ERROR);
    });

    it('creates notification with read=false by default', () => {
      service.send(NotificationType.INFO, 'Test', 'Test message');
      const all = service.getAll();
      assert.equal(all[0].read, false);
    });

    it('creates notification with a timestamp', () => {
      const before = new Date();
      service.send(NotificationType.INFO, 'Test', 'Test message');
      const after = new Date();
      const n = service.getAll()[0];
      assert.ok(n.timestamp >= before && n.timestamp <= after);
    });

    it('creates notification with a unique id', () => {
      const id1 = service.send(NotificationType.INFO, 'A', 'Msg A');
      const id2 = service.send(NotificationType.INFO, 'B', 'Msg B');
      assert.notEqual(id1, id2);
    });

    it('stores multiple notifications', () => {
      service.send(NotificationType.SUCCESS, 'One', 'First');
      service.send(NotificationType.INFO, 'Two', 'Second');
      assert.equal(service.getAll().length, 2);
    });
  });

  describe('getAll()', () => {
    it('returns empty array when no notifications sent', () => {
      assert.deepEqual(service.getAll(), []);
    });

    it('returns all sent notifications', () => {
      service.send(NotificationType.SUCCESS, 'T1', 'M1');
      service.send(NotificationType.ERROR, 'T2', 'M2');
      assert.equal(service.getAll().length, 2);
    });

    it('returns a copy of notifications (immutability)', () => {
      service.send(NotificationType.INFO, 'Test', 'Test message');
      const all1 = service.getAll();
      all1.push({
        id: 'injected',
        type: NotificationType.INFO,
        title: 'Injected',
        message: 'Injected',
        timestamp: new Date(),
        read: false,
      });

      const all2 = service.getAll();
      assert.equal(all2.length, 1);
    });
  });

  describe('getUnread()', () => {
    it('returns all notifications as unread initially', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      assert.equal(service.getUnread().length, 2);
    });

    it('excludes read notifications', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      const id = service.send(NotificationType.INFO, 'T2', 'M2');
      service.markAsRead(id);
      assert.equal(service.getUnread().length, 1);
    });

    it('returns empty array when all notifications are read', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      service.markAllAsRead();
      assert.deepEqual(service.getUnread(), []);
    });
  });

  describe('markAsRead()', () => {
    it('marks a notification as read and returns true', () => {
      const id = service.send(NotificationType.INFO, 'Test', 'Test message');
      const result = service.markAsRead(id);
      assert.equal(result, true);
      assert.equal(service.getAll()[0].read, true);
    });

    it('returns false for a non-existent notification id', () => {
      const result = service.markAsRead('nonexistent-id');
      assert.equal(result, false);
    });

    it('does not affect other notifications when marking one as read', () => {
      const id1 = service.send(NotificationType.INFO, 'T1', 'M1');
      service.send(NotificationType.INFO, 'T2', 'M2');
      service.markAsRead(id1);

      const all = service.getAll();
      const notification1 = all.find(n => n.id === id1);
      const notification2 = all.find(n => n.id !== id1);
      assert.equal(notification1?.read, true);
      assert.equal(notification2?.read, false);
    });
  });

  describe('markAllAsRead()', () => {
    it('marks all notifications as read', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      service.send(NotificationType.SUCCESS, 'T2', 'M2');
      service.send(NotificationType.WARNING, 'T3', 'M3');
      service.markAllAsRead();

      const all = service.getAll();
      assert.ok(all.every(n => n.read === true));
    });

    it('does not throw when no notifications exist', () => {
      assert.doesNotThrow(() => service.markAllAsRead());
    });
  });

  describe('subscribe()', () => {
    it('calls listener when a notification is sent', () => {
      let received: ReturnType<NotificationService['getAll']>[0] | null = null;
      service.subscribe(n => { received = n; });

      service.send(NotificationType.INFO, 'Test', 'Test message');
      assert.ok(received !== null);
      assert.equal((received as NonNullable<typeof received>).title, 'Test');
    });

    it('calls multiple listeners', () => {
      let count = 0;
      service.subscribe(() => count++);
      service.subscribe(() => count++);
      service.send(NotificationType.INFO, 'Test', 'Msg');
      assert.equal(count, 2);
    });

    it('returns an unsubscribe function that stops future calls', () => {
      let count = 0;
      const unsub = service.subscribe(() => count++);
      service.send(NotificationType.INFO, 'First', 'Msg1');
      unsub();
      service.send(NotificationType.INFO, 'Second', 'Msg2');
      assert.equal(count, 1);
    });

    it('unsubscribing does not affect other subscribers', () => {
      let count1 = 0;
      let count2 = 0;
      const unsub1 = service.subscribe(() => count1++);
      service.subscribe(() => count2++);

      service.send(NotificationType.INFO, 'First', 'Msg');
      unsub1();
      service.send(NotificationType.INFO, 'Second', 'Msg');

      assert.equal(count1, 1);
      assert.equal(count2, 2);
    });
  });

  describe('clear()', () => {
    it('removes all notifications', () => {
      service.send(NotificationType.INFO, 'T1', 'M1');
      service.send(NotificationType.SUCCESS, 'T2', 'M2');
      service.clear();
      assert.deepEqual(service.getAll(), []);
    });

    it('can send new notifications after clearing', () => {
      service.send(NotificationType.INFO, 'Before', 'Before clear');
      service.clear();
      service.send(NotificationType.SUCCESS, 'After', 'After clear');

      const all = service.getAll();
      assert.equal(all.length, 1);
      assert.equal(all[0].title, 'After');
    });

    it('clearing empty service does not throw', () => {
      assert.doesNotThrow(() => service.clear());
    });
  });
});

describe('NotificationSchema', () => {
  it('validates a well-formed notification', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc123',
      type: NotificationType.SUCCESS,
      title: 'Test',
      message: 'Test message',
      timestamp: new Date(),
      read: false,
    });
    assert.ok(result.success);
  });

  it('rejects a notification with an empty title', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc123',
      type: NotificationType.INFO,
      title: '',
      message: 'Test',
      timestamp: new Date(),
      read: false,
    });
    assert.ok(!result.success);
  });

  it('rejects a notification with an empty message', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc123',
      type: NotificationType.INFO,
      title: 'Test',
      message: '',
      timestamp: new Date(),
      read: false,
    });
    assert.ok(!result.success);
  });

  it('rejects an invalid notification type', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc123',
      type: 'critical',
      title: 'Test',
      message: 'Test',
      timestamp: new Date(),
      read: false,
    });
    assert.ok(!result.success);
  });

  it('rejects when timestamp is not a Date', () => {
    const result = NotificationSchema.safeParse({
      id: 'abc123',
      type: NotificationType.INFO,
      title: 'Test',
      message: 'Test message',
      timestamp: '2024-01-01',
      read: false,
    });
    assert.ok(!result.success);
  });
});