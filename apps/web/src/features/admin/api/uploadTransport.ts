import type { Id } from '@portfolio/backend/convex/_generated/dataModel';

export type UploadedStorageAsset = {
  storageId: Id<'_storage'>;
  url: string;
  fileName: string;
};

export async function uploadAssetWithSignedUrl(input: {
  file: File;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: { storageId: Id<'_storage'> }) => Promise<string | null>;
}): Promise<UploadedStorageAsset> {
  const { file, generateUploadUrl, resolveStorageUrl } = input;
  const uploadUrl = await generateUploadUrl();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Upload failed. Please try again.');
  }

  const payload = (await uploadResponse.json()) as { storageId?: string };
  if (!payload.storageId) {
    throw new Error('Upload failed. Missing storage id.');
  }

  const storageId = payload.storageId as Id<'_storage'>;
  const resolvedUrl = await resolveStorageUrl({ storageId });
  if (!resolvedUrl) {
    throw new Error('Unable to resolve uploaded file URL.');
  }

  return {
    storageId,
    url: resolvedUrl,
    fileName: file.name,
  };
}
