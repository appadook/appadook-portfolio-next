import { useSyncExternalStore } from "react";
import { getFunctionName, type FunctionReference } from "convex/server";
import type { BootstrapData } from "@/features/admin/types";
export const initialData: BootstrapData = {
  siteSettings: {
    _id: "settings",
    siteName: "Kurtik Appadoo",
    tagline: "Build useful things",
  },
  projects: [
    {
      _id: "project-1",
      version: 0,
      title: "Example project",
      description: "A project to edit",
      categories: ["Web"],
      techStack: ["TypeScript"],
      order: 1,
    },
  ],
  experiences: [],
  programmingLanguages: [],
  technologies: [
    {
      _id: "technology-1",
      name: "React",
      category: "Frontend",
      order: 1,
      version: 3,
    },
  ],
  cloudProviders: [],
  certificates: [],
  aboutCategories: [],
  aboutItems: [],
};
let data = initialData;
let status = {
  revision: 0,
  publishedRevision: 0,
  publishedAt: null as number | null,
};
const listeners = new Set<() => void>();
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};
const empty: never[] = [];
let review = {
  revision: 0,
  changes: [] as Array<{
    section: string;
    id: string;
    title: string;
    kind: string;
    fields: string[];
  }>,
};

function snapshot(name: string) {
  if (name === "admin:getAdminBootstrap") return data;
  if (name === "publishing:status") return status;
  if (name === "publishing:review") return review;
  return empty;
}
export function useQuery(ref: FunctionReference<"query">, args?: unknown) {
  const name = getFunctionName(ref);
  return useSyncExternalStore(
    subscribe,
    () => (args === "skip" ? undefined : snapshot(name)),
    () => snapshot(name),
  );
}
const mutationCache = new Map<
  string,
  (args: Record<string, unknown>) => Promise<unknown>
>();
export function useMutation(ref: FunctionReference<"mutation">) {
  const name = getFunctionName(ref);
  if (!mutationCache.has(name))
    mutationCache.set(name, async (args) => {
      args = JSON.parse(JSON.stringify(args));
      const patch = { ...args };
      for (const field of (args.clearFields as string[] | undefined) ?? [])
        patch[field] = undefined;
      delete patch.clearFields;
      if (name === "admin:updateTechnology") {
        const item = data.technologies.find((item) => item._id === args.id);
        if (args.expectedVersion !== item?.version)
          throw new Error("Stale technology version");
        data = {
          ...data,
          technologies: data.technologies.map((item) =>
            item._id === args.id
              ? { ...item, ...patch, version: Number(item.version) + 1 }
              : item,
          ),
        };
        status = { ...status, revision: status.revision + 1 };
      } else if (name === "admin:updateProject") {
        if (sessionStorage.getItem("simulate-conflict"))
          throw new Error(
            "This item changed in another tab. Reload the latest version before saving.",
          );
        const item = data.projects.find((item) => item._id === args.id);
        if (args.expectedVersion !== item?.version)
          throw new Error("Stale project version");
        data = {
          ...data,
          projects: data.projects.map((project) =>
            project._id === args.id
              ? { ...project, ...patch, version: Number(project.version) + 1 }
              : project,
          ),
        };
        status = { ...status, revision: status.revision + 1 };
      } else if (name === "publishing:publish")
        status = {
          ...status,
          publishedRevision: status.revision,
          publishedAt: Date.now(),
        };
      else if (name === "admin:upsertSiteSettings") {
        data = { ...data, siteSettings: { _id: "settings", ...args } };
        status = { ...status, revision: status.revision + 1 };
      } else throw new Error(`Unsupported test mutation ${name}`);
      review = {
        revision: status.revision,
        changes:
          status.revision === status.publishedRevision
            ? []
            : data.projects.map((p) => ({
                section: "projects",
                id: p._id,
                title: String(p.title),
                kind: "updated",
                fields: ["title"],
              })),
      };
      listeners.forEach((callback) => callback());
    });
  return mutationCache.get(name)!;
}
export function useAction() {
  return async () => {
    throw new Error("Uploads are tested in the backend suite.");
  };
}

export function usePaginatedQuery() {
  const email = sessionStorage.getItem("test-legacy-email");
  return {
    results: email
      ? [
          {
            _id: "legacy-message",
            name: "Legacy visitor",
            email,
            message: "A saved legacy message.",
            status: "failed",
            attempts: 1,
            createdAt: 1,
          },
        ]
      : [],
    status: "Exhausted",
    loadMore: () => {},
    isLoading: false,
  };
}
