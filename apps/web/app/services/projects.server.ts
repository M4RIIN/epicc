import { projectImageSchema } from '@epicc/content-contracts';
import { apiRequest } from './api.server';

export async function loadProjectImages() {
  const response = await apiRequest('project-images');
  if (!response.ok)
    throw new Response('Les projets sont temporairement indisponibles.', {
      status: 503,
    });
  const images = projectImageSchema.array().parse(await response.json());
  if (images.some((image) => !image.image))
    throw new Response('Les visuels sont temporairement indisponibles.', {
      status: 503,
    });
  return images;
}

export async function saveProjectImage(file: string, form: FormData) {
  const response = await apiRequest(
    `admin/project-images/${encodeURIComponent(file)}`,
    { method: 'POST', body: form },
    true,
  );
  if (response.ok) return null;
  if ([400, 404].includes(response.status))
    return ((await response.json()) as { error: string }).error;
  return 'Enregistrement impossible. Réessayez dans quelques instants.';
}
