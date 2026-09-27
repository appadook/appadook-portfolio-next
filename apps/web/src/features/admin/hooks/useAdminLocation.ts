"use client";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { InspectorMode, SectionId } from "../types";
import { confirmEditorNavigation } from "./useEditorDraft";
const sections = new Set([
  "site-settings",
  "media",
  "inbox",
  "experiences",
  "projects",
  "languages",
  "technologies",
  "providers",
  "certificates",
  "about-categories",
  "about-items",
]);
const eventName = "portfolio-location";
function subscribe(callback: () => void) {
  let previous = window.location.href;
  const change = () => {
    previous = window.location.href;
    callback();
  };
  const pop = () => {
    if (!confirmEditorNavigation())
      window.history.pushState(null, "", previous);
    change();
  };
  window.addEventListener("popstate", pop);
  window.addEventListener(eventName, change);
  return () => {
    window.removeEventListener("popstate", pop);
    window.removeEventListener(eventName, change);
  };
}
function update(patch: Record<string, string | null>, push = false) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(patch)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  window.history[push ? "pushState" : "replaceState"](
    null,
    "",
    `/admin?${params}`,
  );
  window.dispatchEvent(new Event(eventName));
}
export function useAdminLocation() {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const rawSection = params.get("section");
  const rawMode = params.get("mode");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("section")) return;
    try {
      const last = localStorage.getItem("portfolio-last-section");
      if (last && sections.has(last)) update({ section: last });
    } catch {}
  }, []);
  const setActiveSectionId = useCallback((section: SectionId) => {
    try {
      localStorage.setItem("portfolio-last-section", section);
    } catch {}
    update({ section, item: null, mode: null }, true);
  }, []);
  const setSelectedItemId = useCallback(
    (item: string | null) => update({ item }),
    [],
  );
  const setPanelMode = useCallback(
    (mode: InspectorMode) => update({ mode: mode === "view" ? null : mode }),
    [],
  );
  return {
    activeSectionId: (sections.has(rawSection ?? "")
      ? rawSection
      : "projects") as SectionId,
    selectedItemId: params.get("item"),
    panelMode: (rawMode === "create" ||
    rawMode === "edit" ||
    rawMode === "deleteConfirm"
      ? rawMode
      : "view") as InspectorMode,
    setActiveSectionId,
    setSelectedItemId,
    setPanelMode,
  };
}

export function selectAdminRecord(item: string) {
  update({ item, mode: "edit" });
}
