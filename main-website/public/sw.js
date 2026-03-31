self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/ic_stat_notification_icon.png',
            badge: data.badge || '/ic_stat_notification_icon.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url
            },
            tag: data.tag || 'booking-update',
            actions: data.actions || []
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // If a URL was provided in the push data, open it
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
                // Find if any window is already open to our site
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not open, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
        );
    }
});
