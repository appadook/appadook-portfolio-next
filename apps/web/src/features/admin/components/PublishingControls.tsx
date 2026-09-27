"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@portfolio/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Check, Eye, Rocket } from "lucide-react";
import { useState } from "react";
import type { SectionId } from "../types";
import { selectAdminRecord } from "../hooks/useAdminLocation";
import {
  confirmEditorNavigation,
  useHasUnsavedChanges,
} from "../hooks/useEditorDraft";
export function PublishingControls({
  onNavigate,
}: {
  onNavigate: (section: SectionId) => void;
}) {
  const unsaved = useHasUnsavedChanges();
  const status = useQuery(api.publishing.status);
  const [open, setOpen] = useState(false);
  const review = useQuery(api.publishing.review, open ? {} : "skip");
  const publish = useMutation(api.publishing.publish);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const changes = status && status.revision !== status.publishedRevision;
  return (
    <>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        <span
          role="status"
          className="admin-state mr-auto lg:mr-2"
          data-pending={Boolean(changes) || unsaved}
        >
          {unsaved
            ? "Unsaved edits"
            : !status
              ? "Checking publication…"
              : changes
                ? "Unpublished changes"
                : feedback || "Published"}
        </span>
        <a
          href="/admin/preview"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eye size={15} />
          Preview<span className="sr-only"> saved drafts</span>
        </a>
        <Button
          size="sm"
          variant={changes ? "default" : "outline"}
          disabled={!changes}
          onClick={() => {
            if (confirmEditorNavigation()) {
              setFeedback("");
              setOpen(true);
            }
          }}
        >
          <Rocket size={14} className="mr-2" />
          Review changes
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <DialogContent className="admin-workspace max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ready to publish?</DialogTitle>
            <DialogDescription>
              Review all saved changes. Publishing updates the entire portfolio
              together.
            </DialogDescription>
          </DialogHeader>
          {!review ? (
            <p role="status">Loading changes…</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {review.changes.length} changed{" "}
                {review.changes.length === 1 ? "record" : "records"} · Unsaved
                editor changes are not included.
              </p>
              <div>
                {review.changes.map((change) => (
                  <div
                    key={`${change.section}:${change.id}`}
                    className="admin-review-row"
                  >
                    <span
                      className={`text-xs w-16 shrink-0 capitalize ${change.kind === "deleted" ? "text-destructive" : "text-primary"}`}
                    >
                      {change.kind}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words">{change.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {change.section.replaceAll("-", " ")}
                        {change.fields.length
                          ? ` · ${change.fields.map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    {change.kind !== "deleted" && (
                      <button
                        aria-label={`Review ${change.title}`}
                        onClick={() => {
                          setOpen(false);
                          onNavigate(change.section as SectionId);
                          selectAdminRecord(change.id);
                        }}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {review.changes.length === 0 && (
                <p className="text-muted-foreground py-6">
                  Your saved content matches the live portfolio. Publish to
                  synchronize the revision.
                </p>
              )}
              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <Button
                  disabled={pending || status?.revision !== review.revision}
                  onClick={async () => {
                    setPending(true);
                    setFeedback("");
                    try {
                      await publish({ expectedRevision: review.revision });
                      setFeedback("Published successfully");
                      setOpen(false);
                    } catch {
                      setFeedback(
                        "Publishing failed. Review the latest changes and try again.",
                      );
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  <Check size={16} className="mr-2" />
                  {pending ? "Publishing…" : "Publish changes"}
                </Button>
                <a
                  href="/admin/preview"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary"
                >
                  Preview saved drafts
                  <ArrowUpRight size={14} />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                The live site refreshes within 60 seconds after publishing.
              </p>
            </>
          )}
          {feedback.startsWith("Publishing failed") && (
            <p role="alert" className="text-sm text-destructive">
              {feedback}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
