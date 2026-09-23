import type { ReactNode } from 'react';
import type { Activity } from '../../../activities/model/activity';
import type { ActivityDecoBlock, ActivityDecoListStyle, ActivityDecoPage } from '../../../activities/model/activityDecoration';
import { decoPcColsClass, normalizeDecoColumnCount } from '../../../../shared/decoration/decoTypes';
import { decoActivityCardFields, type DecoActivityCardFields } from '../../../../shared/decoration/decoCardFields';
import { goCEnd, goCEndActivityList, goCEndActivitySearch, goCEndPastMoments, goH5MySignups, goPcMySignups } from '../../../../app/navigation';
import { CLIENT_TABS, filterByTab, pastHighlightActivities, signupCta, type ClientTabId } from '../model/clientActivity';
import { ActivityMeta } from './ActivityMeta';
import { HomeQuotaBlock } from './HomeQuotaBlock';
import { ActivityCoverOverlay, ActivitySideCopy } from './StatusPill';
import { HomeBanner } from './HomeBanner';
import { IconUser } from './Icons';
import { H5ActivityListCard, PastActivityRailCard } from '../h5/H5ActivityCards';
import { useCEndEmptyPreview } from '../../portal/emptyPreview';

export type HomeSurface = 'h5' | 'pc';

function moreTarget(link: string, surface: HomeSurface, kind: 'activity' | 'moments') {
  if (link.includes('past-moments') || kind === 'moments') {
    return () => goCEndPastMoments(surface);
  }
  return () => goCEndActivityList(surface);
}

function listClass(
  style: ActivityDecoListStyle,
  surface: HomeSurface,
  columnCount?: number,
  type = 'activity',
): string {
  const base = surface === 'pc' ? 'c-pc-grid' : 'c-h5-list';
  if (surface !== 'pc') return `${base} is-${style}`;
  return `${base} is-${style} ${decoPcColsClass(normalizeDecoColumnCount(style, 'pc', columnCount, type))}`;
}

function overlayLayout(style: ActivityDecoListStyle) {
  if (style === 'scroll') return 'large-image';
  if (style === 'two-col' || style === 'large-image' || style === 'left-image' || style === 'left-text') return style;
  return undefined;
}

export function PastHighlightList({
  activities,
  style,
  surface,
  columnCount,
  fields,
}: {
  activities: Activity[];
  style: ActivityDecoListStyle;
  surface: HomeSurface;
  columnCount?: number;
  fields?: Partial<DecoActivityCardFields>;
}) {
  if (activities.length === 0) return <p className="c-empty">暂无已结束活动</p>;
  return (
    <ul
      className={style === 'scroll' && surface !== 'pc' ? 'c-past-rail' : listClass(style, surface, columnCount, 'moments')}
      aria-label="往期精彩回顾"
    >
      {activities.map((activity) => (
        <li key={activity.id}>
          <PastActivityRailCard
            activity={activity}
            layout={overlayLayout(style)}
            fields={fields}
            onOpen={() => goCEnd(surface, activity.id)}
          />
        </li>
      ))}
    </ul>
  );
}

export function ActivityStyleList({
  activities,
  style,
  surface,
  signedIds,
  columnCount,
  fields,
}: {
  activities: Activity[];
  style: ActivityDecoListStyle;
  surface: HomeSurface;
  signedIds: Set<number>;
  columnCount?: number;
  fields?: Partial<DecoActivityCardFields>;
}) {
  if (activities.length === 0) {
    return <p className="c-empty">暂无相关活动</p>;
  }
  const open = (id: number) => goCEnd(surface, id);
  if (surface === 'h5') {
    return (
      <ul className={listClass(style, surface, columnCount)} aria-label="活动列表">
        {activities.map((activity) => (
          <li key={activity.id}>
            <H5ActivityListCard
              activity={activity}
              signedUp={signedIds.has(activity.id)}
              onOpen={() => open(activity.id)}
              layout={overlayLayout(style)}
              fields={fields}
            />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={listClass(style, surface, columnCount)} aria-label="活动列表">
      {activities.map((activity) => {
        const cta = signupCta(activity, signedIds.has(activity.id));
        return (
          <li key={activity.id}>
            <button
              className={`c-pc-card c-card-btn is-${style}`}
              type="button"
              aria-label={`活动 ${activity.title}`}
              onClick={() => open(activity.id)}
            >
              <div className={`c-cover${style === 'left-image' || style === 'left-text' ? ' is-side is-contain' : ''}`}>
                {activity.coverUrl ? <img src={activity.coverUrl} alt="" /> : null}
                <ActivityCoverOverlay
                  activity={activity}
                  variant="home"
                  layout={overlayLayout(style)}
                  fields={fields}
                />
              </div>
              <div className="c-pc-card-body">
                {style === 'left-image' || style === 'left-text' ? (
                  <ActivitySideCopy activity={activity} fields={fields} />
                ) : null}
                <ActivityMeta
                  activity={activity}
                  compact
                  hidePlace={style === 'left-image' || style === 'left-text'}
                  fields={fields}
                />
                <HomeQuotaBlock
                  activity={activity}
                  ctaLabel={cta.label}
                  ctaEnabled={cta.enabled}
                  signedUp={signedIds.has(activity.id)}
                  compact={style === 'left-image' || style === 'left-text'}
                  fields={fields}
                />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function HomeMineBtn({ surface }: { surface: HomeSurface }) {
  return (
    <button
      className="c-home-mine-btn"
      type="button"
      aria-label="我的活动"
      onClick={surface === 'pc' ? goPcMySignups : goH5MySignups}
    >
      <IconUser />
    </button>
  );
}

function HomeSearchRow({ children, surface }: { children: ReactNode; surface: HomeSurface }) {
  return (
    <div className="c-home-search-row">
      {children}
      <HomeMineBtn surface={surface} />
    </div>
  );
}

function ActivitySection({
  block,
  surface,
  activities,
  signedIds,
  tab,
  onTab,
}: {
  block: ActivityDecoBlock;
  surface: HomeSurface;
  activities: Activity[];
  signedIds: Set<number>;
  tab: ClientTabId;
  onTab: (tab: ClientTabId) => void;
}) {
  const list = filterByTab(activities, tab).slice(0, block.latestCount);
  const showMore = block.showMore && !useCEndEmptyPreview();
  return (
    <>
      <div className={surface === 'pc' ? 'c-catalog-bar' : undefined}>
      {surface === 'pc' ? (
        <div className="c-catalog-title-row">
          {block.titleBar ? <h2 className="c-catalog-title">{block.title}</h2> : null}
        </div>
      ) : block.titleBar ? (
        <h2 className="c-catalog-title">{block.title}</h2>
      ) : null}
      <div className="c-catalog-toolbar">
        <div className="c-tabs" role={surface === 'pc' ? 'tablist' : 'group'} aria-label="活动分类">
          {CLIENT_TABS.map((item) => {
            const active = item.id === tab;
            return (
              <button
                key={item.id}
                className={`c-tab${active ? ' is-active' : ''}`}
                type="button"
                role={surface === 'pc' ? 'tab' : undefined}
                aria-pressed={surface === 'pc' ? undefined : active}
                aria-selected={surface === 'pc' ? active : undefined}
                onClick={() => onTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {showMore ? (
          <div className="c-catalog-more">
            <button type="button" onClick={moreTarget(block.moreLink, surface, 'activity')}>
              查看全部
            </button>
          </div>
        ) : null}
      </div>
      </div>
      <ActivityStyleList
        activities={list}
        style={block.listStyle}
        surface={surface}
        signedIds={signedIds}
        columnCount={block.columnCount}
        fields={decoActivityCardFields(block)}
      />
    </>
  );
}

function MomentsSection({
  block,
  surface,
  activities,
}: {
  block: ActivityDecoBlock;
  surface: HomeSurface;
  activities: Activity[];
}) {
  const past = pastHighlightActivities(activities, block.latestCount);
  const titleId = `${surface}-past-title`;
  const showMore = block.showMore && !useCEndEmptyPreview();
  return (
    <section className="c-past-sec" aria-labelledby={titleId}>
      <div className="c-past-head">
        {block.titleBar ? (
          <h2 id={titleId} className="c-past-title">
            {block.title === '精彩瞬间' ? '往期精彩回顾' : block.title}
          </h2>
        ) : (
          <h2 id={titleId} className="sr-only">
            往期精彩回顾
          </h2>
        )}
        {showMore ? (
          <div className="c-catalog-more">
            <button type="button" onClick={moreTarget(block.moreLink, surface, 'moments')}>
              查看全部
            </button>
          </div>
        ) : null}
      </div>
      <PastHighlightList
        activities={past}
        style={block.listStyle}
        surface={surface}
        columnCount={block.columnCount}
        fields={decoActivityCardFields(block)}
      />
    </section>
  );
}

export function ActivityHomePreviewBlocks({
  layout,
  surface,
  activities,
  signedIds,
  tab,
  onTab,
  searchClassName,
}: {
  layout: ActivityDecoPage;
  surface: HomeSurface;
  activities: Activity[];
  signedIds: Set<number>;
  tab: ClientTabId;
  onTab: (tab: ClientTabId) => void;
  searchClassName: string;
}): ReactNode {
  return layout.blocks.map((block) => {
    if (block.type === 'search') {
      return (
        <HomeSearchRow key={block.id} surface={surface}>
          <button
            className={searchClassName}
            type="button"
            aria-label={block.placeholder}
            onClick={() => goCEndActivitySearch(surface)}
          >
            {block.placeholder}
          </button>
        </HomeSearchRow>
      );
    }
    if (block.type === 'activity') {
      return (
        <section key={block.id} id={`${surface}-activity-catalog`} className={surface === 'pc' ? 'c-pc-section c-catalog' : 'c-h5-section c-h5-catalog'}>
          <ActivitySection
            block={block}
            surface={surface}
            activities={activities}
            signedIds={signedIds}
            tab={tab}
            onTab={onTab}
          />
        </section>
      );
    }
    if (block.type === 'moments') {
      return <MomentsSection key={block.id} block={block} surface={surface} activities={activities} />;
    }
    if (block.type === 'banner') {
      return <HomeBanner key={block.id} block={block} surface={surface} />;
    }
    return null;
  });
}
