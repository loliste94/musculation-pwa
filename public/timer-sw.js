self.addEventListener('message', event => {
  if (event.data?.type !== 'SET_TIMER') return
  const { delay, body } = event.data
  setTimeout(() => {
    self.registration.showNotification('Repos terminé 💪', {
      body: body || "Série suivante — c'est parti !",
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'rest-timer',
      renotify: true,
      vibrate: [200, 100, 200],
    })
  }, delay)
})