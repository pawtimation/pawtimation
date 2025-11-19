const KEY = "pt_client_notifications";

export function loadNotifications() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function saveNotifications(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addNotification(message) {
  const list = loadNotifications();
  list.unshift({
    id: crypto.randomUUID(),
    message,
    createdAt: new Date().toISOString(),
    read: false
  });
  saveNotifications(list);
}

export function markAllRead() {
  const list = loadNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(list);
}
