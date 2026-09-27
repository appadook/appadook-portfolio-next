import type { Id } from "@portfolio/backend/convex/_generated/dataModel";

export type UploadedStorageAsset = {
  storageId: Id<"_storage">;
  url: string;
  fileName: string;
};

export async function uploadAssetWithSignedUrl(input: {
  file: File;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  generateUploadUrl: () => Promise<string>;
  resolveStorageUrl: (args: {
    storageId: Id<"_storage">;
    fileName?: string;
  }) => Promise<string | null>;
}): Promise<UploadedStorageAsset> {
  const { file, generateUploadUrl, resolveStorageUrl } = input;
  const uploadUrl = await generateUploadUrl();

  const payload = await new Promise<{ storageId: string }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );
      xhr.timeout = 120000;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable)
          input.onProgress?.(Math.round((event.loaded / event.total) * 90));
      };
      const abort = () => xhr.abort();
      input.signal?.addEventListener("abort", abort, { once: true });
      xhr.onloadend = () => input.signal?.removeEventListener("abort", abort);
      xhr.onerror = xhr.ontimeout = () =>
        reject(
          new Error("Upload failed. Check your connection and try again."),
        );
      xhr.onabort = () => reject(new Error("Upload cancelled."));
      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText);
          if (xhr.status < 200 || xhr.status >= 300 || !body.storageId)
            throw new Error("Upload rejected.");
          resolve(body);
        } catch {
          reject(new Error("Upload failed. Please try again."));
        }
      };
      if (input.signal?.aborted) {
        reject(new Error("Upload cancelled."));
        return;
      }
      xhr.send(file);
    },
  );

  const storageId = payload.storageId as Id<"_storage">;
  const resolvedUrl = await resolveStorageUrl({
    storageId,
    fileName: file.name,
  });
  if (!resolvedUrl) {
    throw new Error("Unable to resolve uploaded file URL.");
  }

  input.onProgress?.(100);
  return {
    storageId,
    url: resolvedUrl,
    fileName: file.name,
  };
}
