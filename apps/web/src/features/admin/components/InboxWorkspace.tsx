"use client";
import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@portfolio/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Mail, ArrowUpRight } from "lucide-react";
export function InboxWorkspace() {
  const [filter, setFilter] = useState<"all" | "queued" | "sent" | "failed">(
    "all",
  );
  const { results, status, loadMore } = usePaginatedQuery(
    api.contact.messages,
    { status: filter === "all" ? undefined : filter },
    { initialNumItems: 25 },
  );
  const retry = useMutation(api.contact.retryDelivery);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const selected = results.find((message) => message._id === selectedId);
  return (
    <div>
      <div className="admin-toolbar">
        <select
          aria-label="Delivery status"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value as typeof filter);
            setSelectedId(null);
            setFeedback("");
          }}
        >
          <option value="all">All deliveries</option>
          <option value="queued">Queued</option>
          <option value="sent">Delivered</option>
          <option value="failed">Failed</option>
        </select>
        <span className="text-xs text-muted-foreground">
          {results.length} messages loaded
        </span>
      </div>
      {status === "LoadingFirstPage" ? (
        <p role="status" className="admin-empty">
          Loading messages…
        </p>
      ) : !results.length ? (
        <div className="admin-empty">
          <Mail size={28} className="mx-auto mb-4 text-muted-foreground" />
          <h2>No {filter === "all" ? "" : filter} messages</h2>
          <p className="text-muted-foreground mt-2">
            Messages from your portfolio contact form appear here.
          </p>
        </div>
      ) : (
        <div className="admin-inbox">
          <div>
            {results.map((message) => (
              <button
                key={message._id}
                className="w-full text-left border-b border-border p-4 hover:bg-muted/40"
                style={
                  message._id === selectedId
                    ? { background: "hsl(var(--muted))" }
                    : undefined
                }
                aria-pressed={message._id === selectedId}
                onClick={() => {
                  setSelectedId(message._id);
                  setFeedback("");
                  document
                    .getElementById("message-detail")
                    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                }}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{message.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground mt-1">
                  {message.email}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground my-3">
                  {message.message}
                </p>
                <span
                  className={`text-xs ${message.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {message.status === "sent"
                    ? "Email delivered"
                    : message.status === "failed"
                      ? "Delivery failed"
                      : "Email queued"}
                </span>
              </button>
            ))}
          </div>
          <section
            id="message-detail"
            className="admin-inbox-detail"
            aria-label="Message detail"
          >
            {selected ? (
              <>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground break-all">
                  {selected.email}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                <p className="my-8 whitespace-pre-wrap break-words leading-relaxed">
                  {selected.message}
                </p>
                <a
                  className="inline-flex items-center gap-2 text-primary"
                  href={`mailto:${encodeURIComponent(selected.email)}`}
                >
                  Reply by email
                  <ArrowUpRight size={16} />
                </a>
                {selected.status === "failed" && (
                  <div className="border-t border-border mt-8 pt-5">
                    <p className="text-sm text-muted-foreground mb-3">
                      The message is saved here, but its email notification
                      could not be delivered.
                    </p>
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={async () => {
                        setPending(true);
                        try {
                          await retry({ id: selected._id });
                          setFeedback("Delivery queued again.");
                        } catch {
                          setFeedback("Retry failed. Please try again.");
                        } finally {
                          setPending(false);
                        }
                      }}
                    >
                      {pending ? "Queueing…" : "Retry email delivery"}
                    </Button>
                  </div>
                )}
                <p role="status" className="mt-4 text-sm">
                  {feedback}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground py-12 text-center">
                Select a message to read it.
              </p>
            )}
          </section>
        </div>
      )}
      {status !== "Exhausted" && (
        <Button
          className="mt-6"
          variant="outline"
          disabled={status !== "CanLoadMore"}
          onClick={() => loadMore(25)}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more messages"}
        </Button>
      )}
    </div>
  );
}
