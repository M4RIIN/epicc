import { projectImageSchema } from '@epicc/content-contracts';
import { clientsRequest } from './clients.server';

export async function loadProjectImages() {
  const response = await clientsRequest('project-images');
  if (!response.ok)
    throw new Response('Les projets sont temporairement indisponibles.', {
      status: 503,
    });
  return projectImageSchema.array().parse(await response.json());
}

export async function saveProjectImage(file: string, form: FormData) {
  const response = await clientsRequest(
    `admin/project-images/${encodeURIComponent(file)}`,
    { method: 'POST', body: form },
    true,
  );
  if (response.ok) return null;
  if ([400, 404].includes(response.status))
    return ((await response.json()) as { error: string }).error;
  return 'Enregistrement impossible. Réessayez dans quelques instants.';
}
