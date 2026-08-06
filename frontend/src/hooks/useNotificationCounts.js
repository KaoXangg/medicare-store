import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const empty = { orders: 0, contacts: 0 };

/** @param {{ admin?: boolean, enabled?: boolean, refreshKey?: number }} opts */
export default function useNotificationCounts({ admin = false, enabled = true, refreshKey = 0 } = {}) {
  const [counts, setCounts] = useState(empty);

  const refresh = useCallback(() => {
    if (!enabled) {
      setCounts(empty);
      return Promise.resolve(empty);
    }
    const url = admin ? '/admin/notifications' : '/notifications/my';
    return api
      .get(url)
      .then((r) => {
        const next = admin
          ? {
              orders: r.data?.counts?.orders ?? 0,
              contacts: r.data?.counts?.contacts ?? 0,
            }
          : {
              orders: r.data?.orders ?? 0,
              contacts: r.data?.contacts ?? 0,
            };
        setCounts(next);
        return next;
      })
      .catch(() => {
        setCounts(empty);
        return empty;
      });
  }, [admin, enabled]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 45000);
    return () => clearInterval(id);
  }, [refresh, refreshKey]);

  return { counts, refresh };
}
