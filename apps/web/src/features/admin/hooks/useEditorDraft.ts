"use client";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
const dirtyEditors = new Set<string>();
const listeners = new Set<() => void>();
function notifyDirty() {
  listeners.forEach((listener) => listener());
}
export function useHasUnsavedChanges() {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => dirtyEditors.size > 0,
    () => false,
  );
}
export function useBulkDirty(key: string, dirty: boolean) {
  useEffect(() => {
    if (dirty) dirtyEditors.add(key);
    else dirtyEditors.delete(key);
    notifyDirty();
    return () => {
      dirtyEditors.delete(key);
      notifyDirty();
    };
  }, [key, dirty]);
}
export function confirmEditorNavigation() {
  return (
    dirtyEditors.size === 0 ||
    window.confirm(
      "You have unsaved changes. Leave this workspace? Individual editor drafts are kept in this tab; ordering and bulk edits are not saved.",
    )
  );
}
export function useEditorDraft<T extends Record<string, string>>(
  key: string,
  initial: T,
  version: number,
  active = true,
) {
  const [initialJson, setInitialJson] = useState(() => JSON.stringify(initial));
  const [recovery, setRecovery] = useState(() => {
    if (active && typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const draft = JSON.parse(stored);
          if (
            draft.form &&
            typeof draft.version === "number" &&
            Object.values(draft.form).every(
              (value) => typeof value === "string",
            )
          )
            return {
              form: draft.form as T,
              version: draft.version as number,
              recovered: true,
            };
        }
      } catch {
        /* Storage may be disabled. Editing still works. */
      }
    }
    return { form: initial, version, recovered: false };
  });
  const [form, setForm] = useState(recovery.form);
  const dirty = active && JSON.stringify(form) !== initialJson;
  useEffect(() => {
    if (!active) return;
    if (dirty) dirtyEditors.add(key);
    else dirtyEditors.delete(key);
    notifyDirty();
    try {
      if (dirty)
        sessionStorage.setItem(
          key,
          JSON.stringify({ form, version: recovery.version }),
        );
      else sessionStorage.removeItem(key);
    } catch {
      /* Best effort recovery */
    }
    return () => {
      dirtyEditors.delete(key);
      notifyDirty();
    };
  }, [key, form, dirty, active, recovery.version]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);
  const saved = useCallback(
    (nextVersion?: number) => {
      if (nextVersion !== undefined) {
        setInitialJson(JSON.stringify(form));
        setRecovery({ form, version: nextVersion, recovered: false });
      }
      dirtyEditors.delete(key);
      notifyDirty();
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* Best effort */
      }
    },
    [key, form],
  );
  const discard = () => {
    if (
      !window.confirm(
        "Discard this recovery draft and load the latest saved version?",
      )
    )
      return;
    saved();
    setInitialJson(JSON.stringify(initial));
    setForm(initial);
    setRecovery({ form: initial, version, recovered: false });
  };
  return {
    form,
    setForm,
    discard,
    baseVersion: recovery.version,
    dirty,
    recovered: recovery.recovered,
    saved,
  };
}
