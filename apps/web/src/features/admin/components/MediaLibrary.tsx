"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAction, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@portfolio/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ImageIcon, Upload, X, ArrowUpRight } from "lucide-react";
import { uploadAssetWithSignedUrl } from "../api/uploadTransport";
import { validateUpload } from "./adminShared";
import type { UploadFieldKind } from "./adminShared";
import type { FunctionReturnType } from "convex/server";

type Asset = FunctionReturnType<typeof api.publishing.assets>["page"][number];
export function MediaLibrary({
  onSelect,
  kind,
}: {
  onSelect?: (url: string) => void;
  kind?: UploadFieldKind;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.publishing.assets,
    {},
    { initialNumItems: 24 },
  );
  const remove = useMutation(api.publishing.removeAsset);
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl);
  const resolveStorageUrl = useAction(api.admin.resolveStorageUrl);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [removing, setRemoving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const visible = results.filter((asset) => {
    const pdf = asset.contentType === "application/pdf";
    return (
      (!kind ||
        (kind === "resumePdf"
          ? pdf
          : asset.contentType.startsWith("image/") &&
            asset.size <= (kind === "logo" ? 3 : 5) * 1024 * 1024)) &&
      (filter === "all" ||
        (filter === "unused"
          ? asset.removable
          : filter === "pdf"
            ? pdf
            : asset.contentType.startsWith("image/"))) &&
      `${asset.fileName ?? ""} ${asset.usage.map((use) => use.title).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  return (
    <div>
      <div className="admin-toolbar">
        <input
          className="admin-search"
          aria-label="Search loaded media"
          placeholder="Search loaded files or usage…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter media"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All files</option>
          <option value="image">Images</option>
          <option value="pdf">Documents</option>
          <option value="unused">Eligible for removal</option>
        </select>
        {!onSelect && (
          <label className="ml-auto cursor-pointer rounded-md border border-border px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <Upload size={16} />
              {uploading ? `Uploading ${progress}%` : "Upload files"}
            </span>
            <input
              aria-label="Upload files"
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              disabled={uploading}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const validation = validateUpload(
                  file,
                  file.type === "application/pdf" ? "resumePdf" : "image",
                );
                if (validation) {
                  setError(validation);
                  return;
                }
                setUploading(true);
                setError("");
                setFeedback("");
                controller.current = new AbortController();
                try {
                  await uploadAssetWithSignedUrl({
                    file,
                    generateUploadUrl,
                    resolveStorageUrl,
                    onProgress: setProgress,
                    signal: controller.current.signal,
                  });
                  setFeedback(`${file.name} uploaded.`);
                } catch (error) {
                  setError(
                    error instanceof Error ? error.message : "Upload failed.",
                  );
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        )}
        {uploading && (
          <Button variant="outline" onClick={() => controller.current?.abort()}>
            Cancel upload
          </Button>
        )}
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        {results.length} files loaded. Legacy external images remain attached to
        their content. Referenced files and uploads from the last 24 hours are
        protected.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-destructive">
          {error}
        </p>
      )}
      {feedback && (
        <p role="status" className="mb-4 text-primary">
          {feedback}
        </p>
      )}
      {status === "LoadingFirstPage" ? (
        <p role="status" className="admin-empty">
          Loading media…
        </p>
      ) : visible.length === 0 ? (
        <div className="admin-empty">
          <ImageIcon size={28} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-medium">
            {results.length
              ? "No matching files"
              : "Your media library starts here"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {results.length
              ? "Adjust your filters or load more files."
              : "Upload images and documents to reuse throughout your portfolio."}
          </p>
        </div>
      ) : (
        <div className="admin-media-grid">
          {visible.map((asset) => (
            <article className="admin-media-item" key={asset._id}>
              <button
                className="admin-media-preview"
                aria-label={`${onSelect ? "Select" : "Inspect"} ${asset.fileName ?? "uploaded file"}`}
                onClick={() =>
                  onSelect ? onSelect(asset.url) : setSelected(asset)
                }
              >
                {asset.contentType.startsWith("image/") ? (
                  <Image
                    src={asset.url}
                    alt=""
                    fill
                    sizes="240px"
                    className="object-contain p-2"
                  />
                ) : (
                  <FileText size={36} className="text-muted-foreground" />
                )}
              </button>
              <div className="p-3">
                <p
                  className="truncate text-sm font-medium"
                  title={asset.fileName}
                >
                  {asset.fileName ??
                    (asset.contentType === "application/pdf"
                      ? "Document"
                      : "Uploaded image")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(asset.size / 1024)} KB ·{" "}
                  {asset.usage.length
                    ? "In use"
                    : asset.removable
                      ? "Unused"
                      : "Recent upload"}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
      {status !== "Exhausted" && (
        <Button
          className="mt-6"
          variant="outline"
          disabled={status !== "CanLoadMore"}
          onClick={() => loadMore(24)}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more files"}
        </Button>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !removing) setSelected(null);
        }}
      >
        <DialogContent className="admin-workspace max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.fileName ?? "File details"}</DialogTitle>
            <DialogDescription>
              Usage across saved drafts and the live portfolio.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-primary"
              >
                Open original
                <ArrowUpRight size={15} />
              </a>
              <p className="text-xs text-muted-foreground">
                {selected.contentType} · {Math.round(selected.size / 1024)} KB ·
                Uploaded {new Date(selected.createdAt).toLocaleDateString()}
              </p>
              <ul className="space-y-3">
                {selected.usage.map((use) => (
                  <li
                    key={`${use.state}:${use.section}:${use.id}`}
                    className="text-sm"
                  >
                    <span className="text-xs text-muted-foreground capitalize">
                      {use.state} · {use.section}
                    </span>
                    <p>{use.title}</p>
                  </li>
                ))}
              </ul>
              {!selected.usage.length && (
                <p className="text-muted-foreground">
                  This file is not referenced by saved or published content.
                </p>
              )}
              {selected.removable ? (
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-sm">
                    Removing this file is permanent. Unsaved editors that use it
                    will need a replacement.
                  </p>
                  <Button
                    variant="destructive"
                    disabled={removing}
                    onClick={async () => {
                      setRemoving(true);
                      setError("");
                      try {
                        await remove({ id: selected._id });
                        setSelected(null);
                        setFeedback("File removed.");
                      } catch (error) {
                        setError(
                          error instanceof Error
                            ? error.message
                            : "Unable to remove file.",
                        );
                      } finally {
                        setRemoving(false);
                      }
                    }}
                  >
                    <X size={15} className="mr-2" />
                    {removing ? "Removing…" : "Permanently remove file"}
                  </Button>
                  {error && (
                    <p role="alert" className="text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground border-t border-border pt-4">
                  Protected: files used by content or uploaded within 24 hours
                  cannot be removed.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
