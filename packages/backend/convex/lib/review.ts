import type { ContentSnapshot } from "./content";

type RecordData = { _id: string; [key: string]: unknown };
export function contentRecords(snapshot: ContentSnapshot) {
  return [
    ["site-settings", snapshot.siteSettings ? [snapshot.siteSettings] : []],
    ["projects", snapshot.projects],
    ["experiences", snapshot.experiences],
    ["languages", snapshot.programmingLanguages],
    ["technologies", snapshot.technologies],
    [
      "providers",
      snapshot.cloudProviders.map(
        ({ certificates: _certificates, ...provider }) => provider,
      ),
    ],
    ["certificates", snapshot.cloudProviders.flatMap((p) => p.certificates)],
    ["about-categories", snapshot.aboutCategories],
    [
      "about-items",
      snapshot.aboutItems.map(({ category: _category, ...item }) => item),
    ],
  ] as Array<[string, RecordData[]]>;
}
export function recordTitle(record: RecordData) {
  return String(
    record.title ??
      record.name ??
      record.siteName ??
      record.label ??
      record.company ??
      "Untitled",
  );
}
function fields(record: RecordData) {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([key]) =>
        !["_id", "_creationTime", "version", "updatedAt", "key"].includes(key),
    ),
  );
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return JSON.stringify(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, stable(v)]),
    );
  return JSON.stringify(value) ?? "";
}
export function compareContent(
  draft: ContentSnapshot,
  published: ContentSnapshot,
) {
  const live = new Map(contentRecords(published));
  return contentRecords(draft).flatMap(([section, records]) => {
    const before = new Map(
      (live.get(section) ?? []).map((record) => [record._id, record]),
    );
    const changes: Array<{
      section: string;
      id: string;
      title: string;
      kind: "added" | "updated" | "deleted";
      fields: string[];
    }> = [];
    for (const record of records) {
      const previous = before.get(record._id);
      before.delete(record._id);
      const nextFields = fields(record);
      const oldFields = previous ? fields(previous) : {};
      const changed = [
        ...new Set([...Object.keys(nextFields), ...Object.keys(oldFields)]),
      ].filter((key) => stable(nextFields[key]) !== stable(oldFields[key]));
      if (!previous || changed.length)
        changes.push({
          section,
          id: record._id,
          title: recordTitle(record),
          kind: previous ? "updated" : "added",
          fields: changed,
        });
    }
    for (const record of before.values())
      changes.push({
        section,
        id: record._id,
        title: recordTitle(record),
        kind: "deleted",
        fields: [],
      });
    return changes;
  });
}
export function assetUsage(
  url: string,
  draft: ContentSnapshot,
  published: ContentSnapshot,
) {
  return [
    ["draft", draft],
    ["published", published],
  ].flatMap(([state, snapshot]) =>
    contentRecords(snapshot as ContentSnapshot).flatMap(([section, records]) =>
      records
        .filter((record) =>
          Object.values(record).some((value) => value === url),
        )
        .map((record) => ({
          state: state as string,
          section,
          id: record._id,
          title: recordTitle(record),
        })),
    ),
  );
}
