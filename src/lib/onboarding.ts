import { secureStorage } from '@/lib/secureStorage';

// Per-account flags so a second account on the same phone still sees onboarding once.
const key = (userId: string, what: string) => `vine.${what}.${userId.replace(/[^a-zA-Z0-9]/g, '')}`;

export async function hasSeen(userId: string, what: 'onboarding' | 'welcome'): Promise<boolean> {
  return (await secureStorage.get(key(userId, what))) === '1';
}

export async function markSeen(userId: string, what: 'onboarding' | 'welcome'): Promise<void> {
  await secureStorage.set(key(userId, what), '1');
}
