'use server';

import { cookies } from 'next/headers';
import { COOKIE_NAME, hashPassword } from './auth';

export async function loginAction(password: string): Promise<{ success: boolean; error?: string }> {
  const serverPassword = process.env.AUTH_PASSWORD;

  // If no password configured on server, allow login
  if (!serverPassword) {
    return { success: true };
  }

  if (password !== serverPassword) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  const token = await hashPassword(serverPassword);
  const cookieStore = cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
