"use client";
import { useId, useState } from "react";
import { flushSync } from "react-dom";
import { Plus, X } from "lucide-react";
import type { FormFieldConfig } from "../types";
import { IconPickerField } from "./MediaFields";

export function EditorField({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [entry, setEntry] = useState("");
  const [optionSearch, setOptionSearch] = useState("");
  const label = field.label.replace(
    / \(comma-separated\)| \(one per line\)/g,
    "",
  );
  const wide = ["textarea", "list", "csv"].includes(field.type);
  if (field.type === "icon-picker")
    return (
      <IconPickerField
        label={label}
        required={field.required}
        value={value}
        onChange={onChange}
      />
    );
  const tags = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const commit = () => {
    const next = entry
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (next.length) onChange([...new Set([...tags, ...next])].join(", "));
    setEntry("");
  };
  return (
    <div className={wide ? "admin-field-wide" : ""}>
      <label htmlFor={id} className="admin-field-label">
        {label}
        {field.required ? <span className="text-primary"> *</span> : null}
      </label>
      {field.type === "csv" ? (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span className="admin-tag" key={`${tag}:${index}`}>
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() =>
                    onChange(tags.filter((_, i) => i !== index).join(", "))
                  }
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id={id}
              value={entry}
              placeholder={`Add ${label.toLowerCase()}…`}
              onChange={(event) => setEntry(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  event.stopPropagation();
                  // requestSubmit reads the parent's form state synchronously.
                  // Flush the pending tag before invoking the native form API.
                  flushSync(commit);
                  event.currentTarget.form?.requestSubmit();
                  return;
                }
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  commit();
                }
              }}
            />
            <button
              type="button"
              aria-label={`Add ${label}`}
              className="rounded border border-border px-3"
              onClick={commit}
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Press Enter to add a tag.
          </p>
        </>
      ) : field.type === "list" ? (
        <div className="space-y-2">
          {(value ? value.split("\n") : []).map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <textarea
                id={index === 0 ? id : undefined}
                aria-label={`${label} ${index + 1}`}
                rows={2}
                value={item}
                onChange={(event) => {
                  const values = value.split("\n");
                  values[index] = event.target.value.replaceAll("\n", " ");
                  onChange(values.join("\n"));
                }}
              />
              <button
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                className="p-2 text-muted-foreground"
                onClick={() =>
                  onChange(
                    value
                      .split("\n")
                      .filter((_, i) => i !== index)
                      .join("\n"),
                  )
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            id={!value ? id : undefined}
            type="button"
            className="inline-flex items-center gap-2 text-xs text-primary py-2"
            onClick={() => onChange(value ? `${value}\n ` : " ")}
          >
            <Plus size={14} />
            Add entry
          </button>
        </div>
      ) : field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.key}
          rows={field.key === "longDescription" ? 7 : 3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
        />
      ) : field.type === "select" ? (
        <>
          {(field.options?.length ?? 0) > 7 && (
            <input
              aria-label={`Search ${label} options`}
              placeholder="Find an option…"
              value={optionSearch}
              onChange={(event) => setOptionSearch(event.target.value)}
              className="mb-2"
            />
          )}
          <select
            id={id}
            name={field.key}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={field.required}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {field.options
              ?.filter(
                (option) =>
                  option.value === value ||
                  option.label
                    .toLowerCase()
                    .includes(optionSearch.toLowerCase()),
              )
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </>
      ) : (
        <input
          id={id}
          name={field.key}
          type={
            field.type === "number"
              ? "number"
              : /url$/i.test(field.key)
                ? "url"
                : "text"
          }
          value={value}
          required={field.required}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
export function fieldGroup(key: string) {
  if (
    [
      "longDescription",
      "features",
      "challenges",
      "outcomes",
      "details",
      "timeline",
      "teamSize",
    ].includes(key)
  )
    return "Details";
  if (/url$/i.test(key)) return "Links";
  if (key === "order") return "Display";
  return "Overview";
}
