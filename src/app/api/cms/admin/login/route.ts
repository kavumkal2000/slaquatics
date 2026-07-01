import { loginCmsUser, requireCmsMutationRequest } from '../../../../../lib/cms/auth.ts';
import { cmsRedirect } from '../../../../../lib/cms/security-headers.ts';

export async function POST(request: Request) {
  const mutationError = requireCmsMutationRequest(request);
  if (mutationError) return mutationError;
  const contentType = request.headers.get('content-type') || '';
  let email = '';
  let password = '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    email = String(body?.email || '');
    password = String(body?.password || '');
  } else {
    const form = await request.formData();
    email = String(form.get('email') || '');
    password = String(form.get('password') || '');
  }
  const response = await loginCmsUser(request, email, password);
  if (contentType.includes('application/json') || !response.ok) return response;
  const redirect = cmsRedirect(new URL('/', request.url), 303);
  const cookie = response.headers.get('set-cookie');
  if (cookie) redirect.headers.set('set-cookie', cookie);
  return redirect;
}
