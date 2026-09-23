import { describe, expect, it } from 'vitest';
import {
  applyPinToggle,
  comparePinSort,
  movePinSortItem,
  nextCustomSortIndex,
  pinSortMoveState,
  type PinSortable,
} from './pinSort';

function row(id: number, extra: Partial<PinSortable> = {}): PinSortable {
  return { id, pinned: false, sortIndex: id, ...extra };
}

describe('pinSort', () => {
  it('puts pinned rows first then sortIndex', () => {
    const rows = [row(1), row(2, { pinned: true, sortIndex: 2 }), row(3, { pinned: true, sortIndex: 1 }), row(4)];
    expect([...rows].sort(comparePinSort).map((item) => item.id)).toEqual([3, 2, 1, 4]);
  });

  it('inserts new custom rows just after the pinned zone', () => {
    expect(nextCustomSortIndex([row(1, { pinned: true, sortIndex: 0 }), row(2, { sortIndex: 4 }), row(3, { sortIndex: 8 })])).toBe(3);
    expect(nextCustomSortIndex([row(1, { pinned: true, sortIndex: 0 })])).toBe(0);
  });

  it('pins to the front of the pin zone and unpins to the front of custom zone', () => {
    const start = [row(1, { pinned: true, sortIndex: 0 }), row(2, { sortIndex: 5 }), row(3, { sortIndex: 6 })];
    const pinned = applyPinToggle(start, 3);
    expect(pinned.find((item) => item.id === 3)).toMatchObject({ pinned: true, sortIndex: -1 });
    expect([...pinned].sort(comparePinSort).map((item) => item.id)).toEqual([3, 1, 2]);

    const unpinned = applyPinToggle(pinned, 3);
    expect(unpinned.find((item) => item.id === 3)).toMatchObject({ pinned: false, sortIndex: 4 });
    expect([...unpinned].sort(comparePinSort).map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it('moves only among unpinned neighbors and no-ops at edges or on pinned rows', () => {
    const all = [row(1, { pinned: true, sortIndex: 0 }), row(2, { sortIndex: 1 }), row(3, { sortIndex: 2 }), row(4, { sortIndex: 3 })];
    const visible = [...all].sort(comparePinSort);
    expect(movePinSortItem(all, visible, 1, 'down')).toBeNull();
    expect(movePinSortItem(all, visible, 2, 'up')).toBeNull();
    expect(movePinSortItem(all, visible, 4, 'down')).toBeNull();

    const moved = movePinSortItem(all, visible, 3, 'up');
    expect(moved?.sort(comparePinSort).map((item) => item.id)).toEqual([1, 3, 2, 4]);
  });

  it('hides move on pinned and grays first/last unpinned', () => {
    const visible = [row(1, { pinned: true }), row(2), row(3), row(4)];
    expect(pinSortMoveState(visible, 1)).toEqual({ canMove: false, upDisabled: true, downDisabled: true });
    expect(pinSortMoveState(visible, 2)).toEqual({ canMove: true, upDisabled: true, downDisabled: false });
    expect(pinSortMoveState(visible, 3)).toEqual({ canMove: true, upDisabled: false, downDisabled: false });
    expect(pinSortMoveState(visible, 4)).toEqual({ canMove: true, upDisabled: false, downDisabled: true });
  });
});
