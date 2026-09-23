export type PinSortable = {
  id: number;
  pinned: boolean;
  sortIndex: number;
};

export function comparePinSort<T extends PinSortable>(left: T, right: T): number {
  if (left.pinned !== right.pinned) return Number(right.pinned) - Number(left.pinned);
  if (left.sortIndex !== right.sortIndex) return left.sortIndex - right.sortIndex;
  return left.id - right.id;
}

export function nextCustomSortIndex<T extends PinSortable>(items: T[]): number {
  const unpinned = items.filter((item) => !item.pinned);
  if (!unpinned.length) return 0;
  return Math.min(...unpinned.map((item) => item.sortIndex)) - 1;
}

export function nextPinnedSortIndex<T extends PinSortable>(items: T[]): number {
  const pinned = items.filter((item) => item.pinned);
  if (!pinned.length) return 0;
  return Math.min(...pinned.map((item) => item.sortIndex)) - 1;
}

export function applyPinToggle<T extends PinSortable>(items: T[], id: number): T[] {
  const current = items.find((item) => item.id === id);
  if (!current) return items;
  const others = items.filter((item) => item.id !== id);
  if (current.pinned) {
    const sortIndex = nextCustomSortIndex(others);
    return items.map((item) => (item.id === id ? { ...item, pinned: false, sortIndex } : item));
  }
  const sortIndex = nextPinnedSortIndex(others);
  return items.map((item) => (item.id === id ? { ...item, pinned: true, sortIndex } : item));
}

export function movePinSortItem<T extends PinSortable>(
  all: T[],
  visible: T[],
  id: number,
  direction: 'up' | 'down',
): T[] | null {
  const current = all.find((item) => item.id === id);
  if (!current || current.pinned) return null;
  const unpinnedVisible = visible.filter((item) => !item.pinned);
  const index = unpinnedVisible.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const swapWith = unpinnedVisible[direction === 'up' ? index - 1 : index + 1];
  if (!swapWith) return null;
  return all.map((item) => {
    if (item.id === id) return { ...item, sortIndex: swapWith.sortIndex };
    if (item.id === swapWith.id) return { ...item, sortIndex: current.sortIndex };
    return item;
  });
}

export function pinSortMoveState<T extends { id: number; pinned: boolean }>(
  visible: T[],
  id: number,
): { canMove: boolean; upDisabled: boolean; downDisabled: boolean } {
  const row = visible.find((item) => item.id === id);
  if (!row || row.pinned) return { canMove: false, upDisabled: true, downDisabled: true };
  const unpinned = visible.filter((item) => !item.pinned);
  const index = unpinned.findIndex((item) => item.id === id);
  return {
    canMove: true,
    upDisabled: index <= 0,
    downDisabled: index >= unpinned.length - 1,
  };
}
