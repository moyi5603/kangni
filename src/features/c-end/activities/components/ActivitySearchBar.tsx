import type { Activity } from '../../../activities/model/activity';
import { goCEnd, type CEndSurface } from '../../../../app/navigation';
import { filterActivitiesByTitle } from '../model/clientActivity';
import { H5ActivitySearchRow } from '../h5/H5ActivityCards';
import { IconSearch } from './Icons';

export function ActivitySearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="c-act-searchbar">
      <span className="c-act-searchbar-ico" aria-hidden>
        <IconSearch />
      </span>
      <input
        type="search"
        value={value}
        placeholder="搜索活动名称"
        aria-label="搜索活动名称"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function ActivitySearchResults({
  query,
  activities,
  surface,
}: {
  query: string;
  activities: Activity[];
  surface: CEndSurface;
}) {
  const needle = query.trim();
  if (!needle) return <p className="c-act-search-empty">输入名称搜索活动</p>;
  const list = filterActivitiesByTitle(activities, needle);
  if (!list.length) return <p className="c-act-search-empty">没有匹配的活动</p>;
  return (
    <ul className={surface === 'pc' ? 'c-act-search-list is-pc-2' : 'c-act-search-list'} aria-label="搜索结果">
      {list.map((activity) => (
        <li key={activity.id}>
          <H5ActivitySearchRow activity={activity} onOpen={() => goCEnd(surface, activity.id)} />
        </li>
      ))}
    </ul>
  );
}
