import {
  adminConfigured,
  adminSession,
  readAdminForm,
  verifyCsrf,
} from './admin.server';

/** Adapte les actions de gestion aux proxys dont l’origine publique n’est pas configurée. */
export async function prepareRequest(request: Request) {
  if (
    process.env.PUBLIC_SITE_URL ||
    request.method !== 'POST' ||
    !adminConfigured()
  )
    return request;
  const url = new URL(request.url);
  if (!/^\/connect(?:\/|\.data$|$)/.test(url.pathname)) return request;
  const originHeader = request.headers.get('Origin');
  if (!originHeader) return request;
  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return request;
  }
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.origin !== originHeader ||
    origin.origin === url.origin
  )
    return request;

  // Un en-tête de proxy ou Origin seul ne prouve rien. Le formulaire doit
  // d’abord présenter le jeton associé au cookie signé par notre serveur.
  // La copie laisse le corps original disponible pour l’action React Router.
  try {
    const session = await adminSession(request);
    const form = await readAdminForm(request.clone());
    url.protocol = origin.protocol;
    url.host = origin.host;
    url.port = origin.port;
    verifyCsrf(new Request(url, { headers: request.headers }), form, session);
    return new Request(url, request);
  } catch {
    return request;
  }
}
