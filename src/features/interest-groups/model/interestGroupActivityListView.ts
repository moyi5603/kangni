export {
  INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY as ACTIVITY_LIST_VIEW_KEY,
  type ListViewMode as InterestGroupActivityListView,
} from '../../../shared/ui/listViewMode';
import {
  INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY,
  readListViewMode,
  writeListViewMode,
  type ListViewMode,
} from '../../../shared/ui/listViewMode';

type Readable = { getItem: (key: string) => string | null };
type Writable = { setItem: (key: string, value: string) => void };

export function readInterestGroupActivityListView(storage?: Readable): ListViewMode {
  return readListViewMode(INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY, storage);
}

export function writeInterestGroupActivityListView(view: ListViewMode, storage?: Writable) {
  writeListViewMode(INTEREST_GROUP_ACTIVITY_LIST_VIEW_KEY, view, storage);
}
