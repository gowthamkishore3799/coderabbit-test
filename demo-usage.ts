import { 
  AnalyticsService, 
  NotificationService, 
  NotificationType,
  type AnalyticsEvent,
  type Notification 
} from '@coderabbit-test/shared-services';

const analytics = new AnalyticsService();
const notifications = new NotificationService();

function demonstrateServices() {
  console.log('=== Demonstrating Internal Package Services ===\n');

  const event: AnalyticsEvent = {
    eventName: 'user_login',
    userId: 'user123',
    timestamp: new Date(),
    properties: {
      browser: 'Chrome',
      version: '120.0.0'
    }
  };

  analytics.track(event);

  analytics.track({
    eventName: 'page_view',
    userId: 'user123',
    timestamp: new Date(),
    properties: {
      page: '/dashboard',
      referrer: '/login'
    }
  });

  const notificationId = notifications.send(
    NotificationType.SUCCESS,
    'Welcome!',
    'You have successfully logged in.'
  );

  notifications.send(
    NotificationType.INFO,
    'New Feature',
    'Check out our new analytics dashboard!'
  );

  console.log('\n=== Analytics Events ===');
  console.log(analytics.exportEvents());

  console.log('\n=== Notifications ===');
  const allNotifications = notifications.getAll();
  allNotifications.forEach(n => {
    console.log(`[${n.type.toUpperCase()}] ${n.title}: ${n.message}`);
  });

  console.log('\n=== Service Recognition Test Complete ===');
  console.log('Internal package successfully referenced and used!');
}

export { demonstrateServices };