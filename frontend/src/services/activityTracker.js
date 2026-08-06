import api from './api';

let queue = [];
let flushTimer = null;
const FLUSH_INTERVAL = 5000;
const MAX_QUEUE = 20;

const isLoggedIn = () => !!localStorage.getItem('token');

const flush = () => {
  if (!queue.length || !isLoggedIn()) {
    queue = [];
    return;
  }
  const events = queue.splice(0, queue.length);
  api.post('/activity', { events }).catch(() => {
    // Mất log không nghiêm trọng, không cần retry để tránh spam khi mất mạng
  });
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL);
};

export const trackEvent = (actionType, detail = {}) => {
  if (!isLoggedIn()) return;
  queue.push({ actionType, detail, pageUrl: window.location.pathname + window.location.search });
  if (queue.length >= MAX_QUEUE) {
    flush();
  } else {
    scheduleFlush();
  }
};

// Gửi NGAY LẬP TỨC, không qua hàng đợi/hẹn giờ 5s như trackEvent thường.
// Dùng cho các sự kiện cần đảm bảo gửi đi TRƯỚC khi token bị xoá (ví dụ: logout) —
// vì trackEvent() thường chỉ đẩy vào hàng đợi, đợi lâu sau mới flush, lúc đó token
// đã bị xoá nên flush() sẽ tự huỷ bỏ (không gửi được nữa).
export const trackEventNow = async (actionType, detail = {}) => {
  if (!isLoggedIn()) return;
  const newEvent = { actionType, detail, pageUrl: window.location.pathname + window.location.search };
  // Gộp luôn các sự kiện đang chờ trong hàng đợi (nếu có) để không bị mất khi đăng xuất
  const pending = queue.splice(0, queue.length);
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  try {
    await api.post('/activity', { events: [...pending, newEvent] });
  } catch {
    // Bỏ qua nếu gửi thất bại — không được để lỗi tracking chặn việc đăng xuất
  }
};

export const trackPageDuration = (pageUrl, duration) => {
  if (!isLoggedIn() || !duration || duration < 1) return;
  queue.push({ actionType: 'page_view', detail: {}, pageUrl, duration: Math.round(duration) });
  flush();
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (!queue.length || !isLoggedIn()) return;
    const events = queue.splice(0, queue.length);
    const token = localStorage.getItem('token');
    try {
      fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch {
      // Bỏ qua nếu trình duyệt không hỗ trợ keepalive
    }
  });
}