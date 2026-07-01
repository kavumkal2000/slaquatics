import { logoutCmsUser, requireCmsMutationRequest } from '../../../../../lib/cms/auth.ts';
import { cmsRedirect } from '../../../../../lib/cms/security-headers.ts';

export async function POST(request: Request) {
  const mutationError = requireCmsMutationRequest(request);
  if (mutationError) return mutationError;
  const response = await logoutCmsUser(request);
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response;
  const redirect = cmsRedirect(new URL('/login', request.url), 303);
  const cookie = response.headers.get('set-cookie');
  if (cookie) redirect.headers.set('set-cookie', cookie);
  return redirect;
}
