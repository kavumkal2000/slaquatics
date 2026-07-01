import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CmsPermission } from '../../lib/cms/auth.ts';
import { requireCmsPermission } from '../../lib/cms/auth.ts';

export async function requireCmsPageUser(permission: CmsPermission = 'content.read') {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') || 'localhost';
  const proto = requestHeaders.get('x-forwarded-proto') || 'https';
  const request = new Request(`${proto}://${host}/cms`, {
    headers: {
      cookie: requestHeaders.get('cookie') || ''
    }
  });
  const user = await requireCmsPermission(request, permission);
  if (user instanceof Response) redirect('/login');
  return user;
}
