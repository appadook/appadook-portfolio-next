export function sortByOrder<T extends { order?: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const leftValue = Number(a.order ?? 0);
    const rightValue = Number(b.order ?? 0);
    const left = Number.isFinite(leftValue) ? leftValue : 0;
    const right = Number.isFinite(rightValue) ? rightValue : 0;
    return left - right;
  });
}

export function areSameIdOrder(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function reconcileDraftOrder(draftIds: string[] | null, canonicalIds: string[]): string[] | null {
  if (!draftIds) {
    return null;
  }

  const canonicalSet = new Set(canonicalIds);
  const filtered = draftIds.filter((id) => canonicalSet.has(id));
  const filteredSet = new Set(filtered);

  for (const id of canonicalIds) {
    if (!filteredSet.has(id)) {
      filtered.push(id);
    }
  }

  return filtered;
}

export function getNextOrder<T extends { order?: unknown }>(items: T[]): number {
  const maxOrder = items.reduce((max, item) => {
    const value = Number(item.order ?? 0);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);

  return maxOrder + 1;
}
