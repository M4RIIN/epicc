import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

export interface ObjectStorage {
  put(key: string, content: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

export function storageFromEnvironment(): ObjectStorage | undefined {
  const mode = process.env.MEDIA_STORAGE ?? 'database';
  if (mode === 'database') return undefined; // Compatibilité pendant la migration.
  if (mode !== 's3')
    throw new Error('MEDIA_STORAGE doit valoir database ou s3.');
  const required = (name: string) => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} est obligatoire pour le stockage S3.`);
    return value;
  };
  const endpoint = new URL(required('S3_ENDPOINT'));
  if (endpoint.protocol !== 'https:' && process.env.NODE_ENV === 'production')
    throw new Error('S3_ENDPOINT doit utiliser HTTPS en production.');
  if (
    process.env.S3_FORCE_PATH_STYLE &&
    !['true', 'false'].includes(process.env.S3_FORCE_PATH_STYLE)
  )
    throw new Error('S3_FORCE_PATH_STYLE doit valoir true ou false.');
  const bucket = required('S3_BUCKET');
  const client = new S3Client({
    endpoint: endpoint.href,
    region: required('S3_REGION'),
    credentials: {
      accessKeyId: required('S3_ACCESS_KEY_ID'),
      secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    maxAttempts: 3,
    requestHandler: { connectionTimeout: 5000, requestTimeout: 30_000 },
  });
  return {
    async put(key, content, mime) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: content,
          ContentType: mime,
        }),
        { abortSignal: AbortSignal.timeout(60_000) },
      );
    },
    async get(key) {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { abortSignal: AbortSignal.timeout(60_000) },
      );
      if (!response.Body) throw new Error('Objet S3 vide.');
      return response.Body.transformToByteArray();
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), {
        abortSignal: AbortSignal.timeout(60_000),
      });
    },
  };
}
