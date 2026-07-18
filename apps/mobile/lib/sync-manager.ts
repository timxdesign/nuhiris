import { api, ApiError } from './api';
import { getPendingQueue, markSynced, markFailed } from './offline-db';
import NetInfo from '@react-native-community/netinfo';

const MAX_RETRIES = 5;

export async function processQueue(): Promise<{ synced: number; failed: number }> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0, failed: 0 };

  const items = await getPendingQueue();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const options: RequestInit = {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': item.idempotencyKey,
        },
      };

      if (item.body) {
        options.body = item.body;
      }

      if (item.method === 'POST') {
        await api.post(item.path, item.body ? JSON.parse(item.body) : {});
      } else if (item.method === 'PUT') {
        await api.put(item.path, item.body ? JSON.parse(item.body) : {});
      }

      await markSynced(item.id);
      synced++;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        await markSynced(item.id);
        synced++;
      } else {
        await markFailed(item.id);
        failed++;
        if (failed >= MAX_RETRIES) break;
      }
    }
  }

  return { synced, failed };
}
