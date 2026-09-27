"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { asId, asText } from "@/features/admin/lib/normalizers";
import { cn } from "@/lib/utils";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, RotateCcw, Save } from "lucide-react";
import { useCallback, useMemo } from "react";
import { SectionCard } from "./ContentCards";
import type {
  ExperienceLayoutToolbarProps,
  ProjectOrderToolbarProps,
  SortableExperienceCardProps,
  SortableExperienceGridProps,
  SortableProjectCardProps,
  SortableProjectGridProps,
} from "./adminShared";

export function ProjectOrderToolbar({
  hasChanges,
  isSaving,
  onSave,
  onReset,
}: ProjectOrderToolbarProps) {
  return (
    <div className="border-y border-border py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Project order</p>
          <p className="text-xs text-muted-foreground">
            Drag rows by the handle to reorder. Save when you are ready to
            publish this order.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasChanges ? (
            <Badge variant="outline">Unsaved order changes</Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isSaving || !hasChanges}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving order..." : "Save Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ExperienceLayoutToolbar({
  hasChanges,
  isSaving,
  currentRoleId,
  currentRoleOptions,
  onCurrentRoleChange,
  onSave,
  onReset,
}: ExperienceLayoutToolbarProps) {
  return (
    <div className="space-y-3 border-y border-border py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Experience layout</p>
        <p className="text-xs text-muted-foreground">
          Drag rows by the handle to reorder and set which role is marked as
          current.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="min-w-64 flex-1">
          <span className="mb-2 block text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Current role
          </span>
          <select
            className="w-full rounded-lg border border-border/60 bg-background-subtle/30 px-3 py-2 text-sm"
            value={currentRoleId ?? ""}
            onChange={(event) => {
              const nextValue = event.target.value.trim();
              onCurrentRoleChange(nextValue === "" ? null : nextValue);
            }}
            disabled={isSaving}
          >
            <option value="">None</option>
            {currentRoleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {hasChanges ? (
            <Badge variant="outline">Unsaved experience changes</Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isSaving || !hasChanges}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving layout..." : "Save Layout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SortableProjectCard({
  item,
  position,
  context,
  isSelected,
  onOpen,
  onEdit,
  onDelete,
}: SortableProjectCardProps) {
  const itemId = asId(item._id);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-manipulation",
        isDragging ? "z-20 opacity-80" : undefined,
      )}
    >
      <SectionCard
        sectionId="projects"
        item={item}
        context={context}
        isSelected={isSelected}
        orderLabel={String(position)}
        dragHandle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Reorder ${asText(item.title, "project")}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        }
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

export function SortableProjectGrid({
  items,
  selectedItemId,
  context,
  onOpen,
  onEdit,
  onDelete,
  onReorder,
}: SortableProjectGridProps) {
  const ids = useMemo(() => items.map((item) => asId(item._id)), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      onReorder(arrayMove(ids, oldIndex, newIndex));
    },
    [ids, onReorder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="flex flex-col">
          {items.map((item, index) => (
            <div key={asId(item._id)}>
              <SortableProjectCard
                item={item}
                position={index + 1}
                context={context}
                isSelected={selectedItemId === asId(item._id)}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  aria-label={`Move item ${index + 1} up`}
                  onClick={() => onReorder(arrayMove(ids, index, index - 1))}
                >
                  Move up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === items.length - 1}
                  aria-label={`Move item ${index + 1} down`}
                  onClick={() => onReorder(arrayMove(ids, index, index + 1))}
                >
                  Move down
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function SortableExperienceCard({
  item,
  position,
  context,
  isSelected,
  onOpen,
  onEdit,
  onDelete,
}: SortableExperienceCardProps) {
  const itemId = asId(item._id);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-manipulation",
        isDragging ? "z-20 opacity-80" : undefined,
      )}
    >
      <SectionCard
        sectionId="experiences"
        item={item}
        context={context}
        isSelected={isSelected}
        orderLabel={String(position)}
        dragHandle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`Reorder ${asText(item.role, "experience")}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        }
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

export function SortableExperienceGrid({
  items,
  selectedItemId,
  context,
  onOpen,
  onEdit,
  onDelete,
  onReorder,
}: SortableExperienceGridProps) {
  const ids = useMemo(() => items.map((item) => asId(item._id)), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      onReorder(arrayMove(ids, oldIndex, newIndex));
    },
    [ids, onReorder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="flex flex-col">
          {items.map((item, index) => (
            <div key={asId(item._id)}>
              <SortableExperienceCard
                item={item}
                position={index + 1}
                context={context}
                isSelected={selectedItemId === asId(item._id)}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  aria-label={`Move item ${index + 1} up`}
                  onClick={() => onReorder(arrayMove(ids, index, index - 1))}
                >
                  Move up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={index === items.length - 1}
                  aria-label={`Move item ${index + 1} down`}
                  onClick={() => onReorder(arrayMove(ids, index, index + 1))}
                >
                  Move down
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
