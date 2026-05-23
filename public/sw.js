self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  let data = { title: 'MyCampus Update', body: 'নতুন নোটিশ প্রকাশিত হয়েছে!', url: '#home' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'MyCampus Update', body: event.data.text(), url: '#home' };
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '#home'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data ? event.notification.data.url : '#home';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Find open dashboard window and refocus/navigate
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url && 'focus' in client) {
          try {
            client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          } catch(err) {}
          return client.focus();
        }
      }
      
      // If none is open, open a new window to the path hash
      if (clients.openWindow) {
        return clients.openWindow('/' + targetUrl);
      }
    })
  );
});
