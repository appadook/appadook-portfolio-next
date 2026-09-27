"use client";
import { Button } from "@/components/ui/button";
import { asId, asText } from "../lib/normalizers";
import { Pencil, Plus, Trash2, ImageIcon, Layers } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import type {
  EmptyStateProps,
  SectionCardGridProps,
  SectionCardProps,
} from "./adminShared";
import { getCardBody, getCardSubtitle, getCardTitle } from "./adminShared";
export function EmptyState({ title, description, onCreate }: EmptyStateProps) {
  return (
    <div className="admin-empty">
      <Layers size={28} className="mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      <Button variant="outline" className="mt-5" onClick={onCreate}>
        <Plus size={16} className="mr-2" />
        Add your first item
      </Button>
    </div>
  );
}
export const SectionCard = memo(function SectionCard({
  sectionId,
  item,
  context,
  isSelected,
  orderLabel,
  dragHandle,
  onOpen,
  onEdit,
  onDelete,
}: SectionCardProps) {
  const id = asId(item._id);
  const title = getCardTitle(sectionId, item, context);
  const thumbnail = asText(
    item.image || item.logo || item.logoUrl || item.iconUrl,
  );
  const visual = ["projects", "certificates", "about-items"].includes(
    sectionId,
  );
  const category = context.aboutCategoryMap.get(asText(item.categoryId));
  const provider = context.providerMap.get(asText(item.providerId));
  const detail =
    sectionId === "providers"
      ? `${context.certificateCountByProvider.get(id) ?? 0} certificates`
      : asText(
          item.status ||
            item.level ||
            (item.isCurrent ? "Current role" : "") ||
            category?.label ||
            provider?.name ||
            item.category,
        );
  return (
    <article className="admin-row" data-selected={isSelected}>
      {dragHandle}
      {orderLabel && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {orderLabel.padStart(2, "0")}
        </span>
      )}
      <button
        className={`admin-row-thumb ${visual ? "" : "compact"}`}
        aria-label={`Open ${title}`}
        onClick={() => onOpen(id)}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes={visual ? "104px" : "48px"}
            className={visual ? "object-cover" : "object-contain p-2"}
          />
        ) : visual ? (
          <ImageIcon size={20} className="text-muted-foreground" />
        ) : (
          <span className="text-sm text-muted-foreground">
            {title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </button>
      <div className="admin-row-main">
        <h3>
          <button
            type="button"
            aria-pressed={isSelected}
            onClick={() => onOpen(id)}
            className="text-left hover:text-primary transition-colors"
          >
            {title}
          </button>
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {getCardSubtitle(sectionId, item, context) ||
            getCardBody(sectionId, item, context)}
        </p>
        {detail && (
          <p className="text-[11px] text-muted-foreground mt-2">{detail}</p>
        )}
      </div>
      <div className="admin-row-actions">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit ${title}`}
          onClick={() => onEdit(id)}
        >
          <Pencil size={15} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Delete ${title}`}
          onClick={() => onDelete(id)}
          className="hover:!text-destructive"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </article>
  );
});
export function SectionCardGrid({
  config,
  items,
  selectedItemId,
  context,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: SectionCardGridProps) {
  if (!items.length)
    return (
      <EmptyState
        title={config.emptyTitle}
        description={config.emptyDescription}
        onCreate={onCreate}
      />
    );
  return (
    <div className="border-t border-border">
      {items.map((item) => (
        <SectionCard
          key={asId(item._id)}
          sectionId={config.id}
          item={item}
          context={context}
          isSelected={selectedItemId === asId(item._id)}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
