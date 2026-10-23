export interface PageProperties {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly published: boolean;
}

export class InvalidPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPageError';
  }
}

export class Page {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly published: boolean;

  constructor(properties: PageProperties) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(properties.slug)) {
      throw new InvalidPageError(
        'Le slug doit contenir des lettres minuscules, des chiffres et des tirets.',
      );
    }
    const title = properties.title.trim();
    const description = properties.description.trim();
    const body = properties.body.trim();
    if (!title || !description || !body) {
      throw new InvalidPageError(
        'Le titre, la description et le contenu sont obligatoires.',
      );
    }
    this.slug = properties.slug;
    this.title = title;
    this.description = description;
    this.body = body;
    this.published = properties.published;
    Object.freeze(this);
  }
}
