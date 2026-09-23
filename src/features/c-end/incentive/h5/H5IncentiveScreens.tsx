import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Drawer,
  Dropdown,
  Empty,
  Modal,
  Input,
  Select,
  Tag,
  Tree,
  Upload,
  App as AntApp,
  Avatar,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  CheckCircleOutlined,
  DownOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SendOutlined,
  ShareAltOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  INCENTIVE_H5_ACQUIRED,
  INCENTIVE_H5_BADGES,
  INCENTIVE_H5_CONTENT,
  INCENTIVE_H5_MONTHS,
  INCENTIVE_H5_PEOPLE,
  INCENTIVE_H5_RECEIPTS,
  INCENTIVE_H5_RECORDS,
  ME_ID,
  ME_NAME,
  type IncentiveH5Badge,
  type IncentiveH5Record,
  type IncentiveH5Scope,
} from './incentiveH5Data';
import {
  badgesByType,
  companyHonoree,
  hotBadges,
  personHonorRecords,
  recipientsFor,
  RANKING_PEOPLE,
  type CompanyStory,
  type PersonTarget,
} from './incentiveH5Ranking';
import { BadgeArt, BadgeDetail, BadgeRules, MobileBackbar, PersonPhoto } from './H5IncentiveBits';
import { goH5Incentive } from '../../../../app/navigation';
import { useCEndEmptyPreview } from '../../portal/emptyPreview';

export function IncentivePcAside() {
  const empty = useCEndEmptyPreview();
  const me = INCENTIVE_H5_PEOPLE.find((item) => item.id === ME_ID) ?? INCENTIVE_H5_PEOPLE[0];
  const mine = empty ? [] : INCENTIVE_H5_BADGES.filter((item) => INCENTIVE_H5_ACQUIRED[item.id]);
  const recent = [...mine]
    .sort((a, b) => INCENTIVE_H5_ACQUIRED[b.id].localeCompare(INCENTIVE_H5_ACQUIRED[a.id]))
    .slice(0, 3);
  return (
    <aside className="c-incentive-pc-aside" aria-label="与我相关">
      <section className="c-incentive-pc-me">
        <PersonPhoto name={me.name} size={56} />
        <div>
          <strong>{me.name}</strong>
          <span>{me.department}</span>
        </div>
      </section>
      <dl className="c-incentive-pc-stats">
        <div>
          <dd>{mine.length}</dd>
          <dt>勋章</dt>
        </div>
        <div>
          <dd>{empty ? 0 : 150}</dd>
          <dt>可用积分</dt>
        </div>
        <div>
          <dd>{empty ? 0 : 50}</dd>
          <dt>本月已发</dt>
        </div>
      </dl>
      <Button type="primary" block size="large" icon={<PlusOutlined />} onClick={() => goH5Incentive('issue')}>
        发放勋章
      </Button>
      <div className="c-incentive-pc-aside-block">
        <h3>最近获得</h3>
        <ul className="c-incentive-pc-recent">
          {recent.length === 0 ? <li>暂无勋章</li> : recent.map((item) => (
            <li key={item.id}>
              <BadgeArt badge={item} />
              <div>
                <b>{item.name}</b>
                <small>{INCENTIVE_H5_ACQUIRED[item.id]} 获得</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

const RANKING_SCOPES = ['全部', '公司表彰', '同事认可'] as const;
const RANKING_PERIODS = ['近一个月', '三个月', '半年'] as const;
type RankingScope = (typeof RANKING_SCOPES)[number];
type RankingPeriod = (typeof RANKING_PERIODS)[number];

function PeriodMenu({ period, onChange }: { period: RankingPeriod; onChange: (next: RankingPeriod) => void }) {
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectedKeys: [period],
        items: RANKING_PERIODS.map((item) => ({ key: item, label: item })),
        onClick: ({ key }) => onChange(key as RankingPeriod),
      }}
    >
      <button type="button" className="c-incentive-period-trigger" aria-label="时间范围" aria-haspopup="menu">
        {period}
        <DownOutlined />
      </button>
    </Dropdown>
  );
}

export function IncentiveHome({
  onRanking,
  onPersonHonor,
  layout = 'h5',
}: {
  onRanking: (badgeId?: string) => void;
  onPersonHonor: (target: PersonTarget) => void;
  layout?: 'h5' | 'pc';
}) {
  const empty = useCEndEmptyPreview();
  const [period, setPeriod] = useState<RankingPeriod>('近一个月');
  const [scopeFilter, setScopeFilter] = useState<RankingScope>('全部');
  const [category, setCategory] = useState('全部');
  const ranked = empty ? [] : layout === 'pc' ? badgesByType(period, '全部类型') : hotBadges('本年', '同事认可');
  const scoped = layout === 'pc' && scopeFilter !== '全部' ? ranked.filter((item) => item.badge.scope === scopeFilter) : ranked;
  const homeCategories = Array.from(new Set(scoped.map((item) => item.badge.category)));
  const medals = layout === 'pc' && category !== '全部' ? scoped.filter((item) => item.badge.category === category) : scoped;
  const shown = layout === 'pc' ? medals : medals.slice(0, 3);
  const mineCount = empty ? 0 : INCENTIVE_H5_BADGES.filter((item) => item.scope === '同事认可' && INCENTIVE_H5_ACQUIRED[item.id]).length;
  const feed = empty ? [] : INCENTIVE_H5_RECORDS.filter((item) => item.status === '已发放');
  return (
    <main className="mobile-home-page mobile-tab-content">
      <section className="mobile-home-ranking-hero">
        <div className="mobile-home-ranking-card">
          <header>
            <h3>热门勋章</h3>
          </header>
          {layout === 'pc' && (
            <div className="c-incentive-home-filters">
              <div className="c-incentive-scope-row">
                <div className="c-incentive-scope-tabs" role="tablist" aria-label="勋章类型">
                  {RANKING_SCOPES.map((item) => {
                    const active = scopeFilter === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={active ? 'is-active' : undefined}
                        onClick={() => {
                          setScopeFilter(item);
                          const nextScoped = item === '全部' ? ranked : ranked.filter((badge) => badge.badge.scope === item);
                          const names = new Set(nextScoped.map((badge) => badge.badge.category));
                          if (category !== '全部' && !names.has(category)) setCategory('全部');
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                <PeriodMenu period={period} onChange={setPeriod} />
              </div>
              <div className="c-incentive-cat-tabs" role="tablist" aria-label="勋章分类">
                {['全部', ...homeCategories].map((item) => {
                  const active = category === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={active ? 'is-active' : undefined}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className={`mobile-home-badge-top3 mobile-home-hot-medals${layout === 'pc' ? ' is-scroll' : ''}`}>
            {shown.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无热门勋章" />
            ) : (
              shown.map((item) => (
              <button type="button" key={item.badge.id} onClick={() => onRanking(item.badge.id)}>
                <BadgeArt badge={item.badge} />
                <strong>{item.badge.name}</strong>
                <span>{item.recipientCount} 人获得</span>
              </button>
              ))
            )}
          </div>
          {layout === 'h5' && (
            <footer className="mobile-home-badge-summary">
              <span>
                我累计获得 <b>{mineCount}</b> 枚勋章
              </span>
              <button type="button" onClick={onRanking}>
                查看全部 <RightOutlined />
              </button>
            </footer>
          )}
        </div>
      </section>
      <section className="mobile-home-feed">
        <header>
          <div>
            <h3>认可动态</h3>
          </div>
        </header>
        {feed.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            onPersonClick={() => {
              const person = RANKING_PEOPLE.find((row) => row.name === item.receiver);
              onPersonHonor({
                id: person?.id ?? item.receiver,
                name: item.receiver,
                department: item.department,
              });
            }}
          />
        ))}
        {!feed.length && <div className="feed-empty-state">暂无认可动态</div>}
      </section>
    </main>
  );
}

function FeedCard({ item, onPersonClick }: { item: IncentiveH5Record; onPersonClick: () => void }) {
  const badge = INCENTIVE_H5_BADGES.find((row) => row.name === item.badge);
  return (
    <article
      className="feed-card recognition-story-card recognition-story-card-clickable"
      role="button"
      tabIndex={0}
      aria-label={`查看${item.receiver}的个人勋章墙`}
      onClick={onPersonClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPersonClick();
        }
      }}
    >
      <header className="feed-line feed-recipient">
        <PersonPhoto name={item.receiver} size={40} />
        <div className="feed-meta">
          <div className="feed-recipient-person-link">
            <span className="feed-recipient-name">
              <strong>{item.receiver}</strong>
              <em>{item.department}</em>
            </span>
            <RightOutlined />
          </div>
          <span className="feed-recipient-honor">
            {item.type === '公司表彰' ? '获得公司认可' : `获得${item.giver}认可`}
          </span>
        </div>
        <time className="feed-card-time">{item.time.slice(5, 16)}</time>
      </header>
      <section className="feed-recognition-body">
        {badge && <BadgeArt badge={badge} className="feed-award-medal" />}
        <div>
          <div className="feed-recognition-title">
            <span>获得勋章</span>
            <strong>{item.badge}</strong>
            <em>+{item.points} 积分</em>
          </div>
          <div className="feed-recognition-reason">
            <small>获得理由</small>
            <p>{item.description}</p>
          </div>
        </div>
      </section>
    </article>
  );
}

export function IncentiveIssue({ layout = 'h5' }: { layout?: 'h5' | 'pc' }) {
  const { message } = AntApp.useApp();
  const [step, setStep] = useState(0);
  const [badge, setBadge] = useState<IncentiveH5Badge>();
  const [detail, setDetail] = useState<IncentiveH5Badge>();
  const [targets, setTargets] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const cost = (badge?.points ?? 0) * targets.length;
  const others = INCENTIVE_H5_PEOPLE.filter((item) => item.id !== ME_ID);
  const names = others.filter((item) => targets.includes(item.id)).map((item) => item.name);
  const pc = layout === 'pc';
  const peer = INCENTIVE_H5_BADGES.filter((item) => item.scope === '同事认可');
  const categories = Array.from(new Set(peer.map((item) => item.category)));
  const treeData = [
    {
      title: '康尼机电集团',
      key: 'group',
      selectable: false,
      checkable: false,
      children: Array.from(new Set(others.map((item) => item.department))).map((dept) => ({
        title: dept,
        key: `department-${dept}`,
        selectable: false,
        checkable: false,
        children: others.filter((item) => item.department === dept).map((item) => ({
          title: item.name,
          key: item.id,
        })),
      })),
    },
  ];

  return (
    <main className="mobile-recognition-page" data-badge-detail={pc ? 'modal' : 'drawer'}>
      {step === 0 && (
        <section className="mobile-all-badge-panel">
          <div className="monthly-issue-quota mobile-monthly-issue-quota">
            <div>
              <span>本月可发放</span>
              <strong>150 积分</strong>
            </div>
            <dl>
              <div>
                <dt>本月额度</dt>
                <dd>200 积分</dd>
              </div>
              <div>
                <dt>已发放</dt>
                <dd>50 积分</dd>
              </div>
            </dl>
            <div className="monthly-issue-quota-progress">
              <i />
            </div>
          </div>
          {categories.map((category) => {
            const items = peer.filter((item) => item.category === category);
            return (
              <div className="mobile-badge-category-group" key={category}>
                <header>
                  <h3>{category}</h3>
                  <span>{items.length} 枚</span>
                </header>
                <div className="mobile-all-badges">
                  {items.map((item) => (
                    <article className="mobile-badge-choice" key={item.id}>
                      <button
                        type="button"
                        className="mobile-badge-issue-trigger"
                        onClick={() => {
                          setBadge(item);
                          setStep(1);
                        }}
                      >
                        <BadgeArt badge={item} className="mobile-badge-icon" />
                        <span>
                          <b>{item.name}</b>
                          <small>{item.points} 积分</small>
                        </span>
                      </button>
                      <button type="button" className="mobile-badge-detail-link" onClick={() => setDetail(item)}>
                        查看详情
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
      {step === 1 && (
        <div className="mobile-form-backbar">
          <Button type="text" shape="circle" icon={<LeftOutlined />} aria-label="返回选择勋章" onClick={() => setStep(0)} />
          <strong>选择勋章</strong>
          <i />
        </div>
      )}
      {step === 1 && badge && (
        <section className="mobile-issue-form-panel mobile-step-panel mobile-combined-step">
          <div className="selected-medal-mobile">
            <BadgeArt badge={badge} />
            <div className="selected-medal-copy">
              <small>已选勋章</small>
              <strong>{badge.name}</strong>
            </div>
            <div className="recognition-points-inline">
              <b>{cost || badge.points} 积分</b>
              <small>可用 150</small>
            </div>
          </div>
          <div className="field-block mobile-recognition-target">
            <label>
              认可对象 <small>可多选</small>
            </label>
            <button
              type="button"
              className={`mobile-target-picker ${targets.length ? 'has-value' : ''}`}
              onClick={() => {
                setChecked(targets);
                setPickerOpen(true);
              }}
            >
              <span>{targets.length ? names.join('、') : '请选择认可对象'}</span>
              <em>{targets.length ? `${targets.length} 人` : '企业组织树'}</em>
              <RightOutlined />
            </button>
            <p className="multi-target-summary">
              {targets.length
                ? `已选 ${targets.length} 人，将生成 ${targets.length} 条记录并扣减 ${cost} 积分`
                : '每位员工独立生成一条认可记录，共用本次勋章、原因和附件'}
            </p>
          </div>
          <div className="field-block reason-field">
            <div className="mobile-reason-heading">
              <label>认可原因</label>
              <Button type="link" onClick={() => setRulesOpen(true)}>
                认可规则
              </Button>
              <small>
                {reason.length} 字 · 至少 {INCENTIVE_H5_CONTENT.minimumReasonLength} 字
              </small>
            </div>
            <Input.TextArea
              rows={5}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={INCENTIVE_H5_CONTENT.reasonPlaceholder}
            />
          </div>
          <div className="field-block mobile-attachment-field">
            <label>
              图片或附件 <em className="required-mark">必填</em>
            </label>
            <Upload.Dragger
              beforeUpload={(file) =>
                file.size > 20 * 1024 * 1024 ? (message.warning('单个文件不能超过 20MB'), Upload.LIST_IGNORE) : false
              }
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
              multiple
              maxCount={5}
              fileList={files}
              onChange={({ fileList }) => {
                if (fileList.length > 5) message.warning('最多上传 5 个文件');
                setFiles(fileList.slice(0, 5));
              }}
            >
              <UploadOutlined />
              <p>点击上传图片或附件</p>
              <small>至少 1 个，最多 5 个；单个不超过 20MB</small>
            </Upload.Dragger>
          </div>
        </section>
      )}
      {step > 0 && (
        <div className="recognition-step-actions mobile-confirm-actions">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              if (!badge) return message.warning('请选择一枚勋章');
              if (!targets.length) return message.warning('请选择至少一名认可对象');
              if (reason.trim().length < INCENTIVE_H5_CONTENT.minimumReasonLength) {
                return message.warning(`认可原因至少填写 ${INCENTIVE_H5_CONTENT.minimumReasonLength} 个字`);
              }
              if (!files.length) return message.warning('请上传至少一张图片或一个附件');
              if (cost > 150) return message.warning(`额度不足：本次需要 ${cost} 积分，当前可用 150 积分`);
              message.success(`已提交 ${targets.length} 条认可记录`);
              setStep(0);
              setBadge(undefined);
              setTargets([]);
              setReason('');
              setFiles([]);
            }}
          >
            确认发放
          </Button>
        </div>
      )}
      {pc ? (
        <Modal
          className="c-incentive-pc-badge-modal"
          wrapClassName="c-incentive-pc-badge-modal"
          centered
          destroyOnHidden
          open={!!detail}
          title={detail?.name}
          okText="发放勋章"
          cancelText="关闭"
          onCancel={() => setDetail(undefined)}
          onOk={() => {
            if (!detail) return;
            setBadge(detail);
            setDetail(undefined);
            setStep(1);
          }}
          width={480}
        >
          {detail && <BadgeDetail badge={detail} showIssueButton={false} />}
        </Modal>
      ) : (
        <Drawer
          title={null}
          closable={false}
          placement="right"
          width="100%"
          open={!!detail}
          onClose={() => setDetail(undefined)}
          getContainer={false}
          rootStyle={{ position: 'absolute' }}
          className="mobile-badge-detail-drawer"
        >
          {detail && (
            <BadgeDetail
              badge={detail}
              onIssue={() => {
                setBadge(detail);
                setDetail(undefined);
                setStep(1);
              }}
            />
          )}
        </Drawer>
      )}
      {pc ? (
        <Modal
          className="c-incentive-pc-badge-modal"
          wrapClassName="c-incentive-pc-rule-modal"
          centered
          destroyOnHidden
          open={rulesOpen}
          title={`${badge?.name ?? ''} · 具体规则`}
          footer={null}
          onCancel={() => setRulesOpen(false)}
          width={560}
        >
          {badge && <BadgeRules badge={badge} />}
        </Modal>
      ) : (
        <Drawer
          title={`${badge?.name ?? ''} · 具体规则`}
          placement="bottom"
          height="72%"
          open={rulesOpen}
          onClose={() => setRulesOpen(false)}
          getContainer={false}
          rootStyle={{ position: 'absolute' }}
          className="mobile-rule-drawer"
        >
          {badge && <BadgeRules badge={badge} />}
        </Drawer>
      )}
      {pc ? (
        <Modal
          className="c-incentive-pc-badge-modal"
          wrapClassName="c-incentive-pc-picker-modal"
          centered
          destroyOnHidden
          open={pickerOpen}
          title="选择认可对象"
          okText={`确认选择（${checked.length}）`}
          cancelText="关闭"
          okButtonProps={{ disabled: !checked.length }}
          onCancel={() => setPickerOpen(false)}
          onOk={() => {
            setTargets(checked);
            setPickerOpen(false);
          }}
          width={520}
        >
          <div className="mobile-target-tree-summary">
            <span>企业组织架构</span>
            <b>已选 {checked.length} 人</b>
          </div>
          <Tree
            checkable
            defaultExpandAll
            selectable={false}
            checkedKeys={checked}
            treeData={treeData}
            onCheck={(keys) =>
              setChecked((Array.isArray(keys) ? keys : keys.checked).map(String).filter((key) => key.startsWith('E')))
            }
          />
        </Modal>
      ) : (
        <Drawer
          title="选择认可对象"
          placement="bottom"
          height="68%"
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          getContainer={false}
          rootStyle={{ position: 'absolute' }}
          className="mobile-target-drawer"
          footer={
            <div className="mobile-target-drawer-actions">
              <Button onClick={() => setPickerOpen(false)}>取消</Button>
              <Button
                type="primary"
                disabled={!checked.length}
                onClick={() => {
                  setTargets(checked);
                  setPickerOpen(false);
                }}
              >
                确认选择（{checked.length}）
              </Button>
            </div>
          }
        >
          <div className="mobile-target-tree-summary">
            <span>企业组织架构</span>
            <b>已选 {checked.length} 人</b>
          </div>
          <Tree
            checkable
            defaultExpandAll
            selectable={false}
            checkedKeys={checked}
            treeData={treeData}
            onCheck={(keys) =>
              setChecked((Array.isArray(keys) ? keys : keys.checked).map(String).filter((key) => key.startsWith('E')))
            }
          />
        </Drawer>
      )}
    </main>
  );
}

export function IncentiveRanking({
  initialBadgeId,
  layout = 'h5',
  onCompanyDetail,
  onPersonHonor,
}: {
  scope?: IncentiveH5Scope;
  initialBadgeId?: string;
  layout?: 'h5' | 'pc';
  onCompanyDetail: (entry: CompanyStory) => void;
  onPersonHonor: (target: PersonTarget) => void;
}) {
  const [period, setPeriod] = useState<RankingPeriod>('近一个月');
  const ranked = badgesByType(period, '全部类型');
  const matchName = ranked.find((item) => item.badge.id === initialBadgeId || item.badge.name === initialBadgeId)?.badge
    .name;
  const [scopeFilter, setScopeFilter] = useState<RankingScope>('全部');
  const [category, setCategory] = useState('全部');
  const [selected, setSelected] = useState(matchName ?? ranked[0]?.badge.name);
  const scoped = scopeFilter === '全部' ? ranked : ranked.filter((item) => item.badge.scope === scopeFilter);
  const categories = Array.from(new Set(scoped.map((item) => item.badge.category)));
  const visible = category === '全部' ? scoped : scoped.filter((item) => item.badge.category === category);
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchName) setSelected(matchName);
  }, [matchName]);
  const badge = visible.find((item) => item.badge.name === selected)?.badge ?? visible[0]?.badge;
  const month = INCENTIVE_H5_MONTHS[0].value;
  useEffect(() => {
    if (layout !== 'pc' || !badge) return;
    stripRef.current?.querySelector<HTMLElement>('.active')?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [layout, badge?.id]);
  const people = badge ? recipientsFor(badge.scope, period, month, badge.name) : [];
  const pcLayout = layout === 'pc';
  const listFor = (nextScope: RankingScope, nextCategory: string) => {
    const byScope = nextScope === '全部' ? ranked : ranked.filter((item) => item.badge.scope === nextScope);
    return nextCategory === '全部' ? byScope : byScope.filter((item) => item.badge.category === nextCategory);
  };
  const focusFirst = (list: typeof ranked) => {
    if (!list.some((item) => item.badge.name === selected) && list[0]) {
      setSelected(list[0].badge.name);
      goH5Incentive('ranking', list[0].badge.id);
    }
  };
  const pickScope = (next: RankingScope) => {
    setScopeFilter(next);
    const byScope = next === '全部' ? ranked : ranked.filter((item) => item.badge.scope === next);
    const names = new Set(byScope.map((item) => item.badge.category));
    const nextCategory = category !== '全部' && !names.has(category) ? '全部' : category;
    if (nextCategory !== category) setCategory(nextCategory);
    focusFirst(listFor(next, nextCategory));
  };
  const pickCategory = (next: string) => {
    setCategory(next);
    focusFirst(listFor(scopeFilter, next));
  };

  return (
    <main className="mobile-tab-content mobile-ranking-page mobile-medal-ranking-page">
      <section className="mobile-medal-tab-ranking">
        <div className="c-incentive-filters">
          <div className="c-incentive-scope-row">
          <div
            className={pcLayout ? 'c-incentive-scope-tabs' : 'c-incentive-scope-scroll'}
            role={pcLayout ? 'tablist' : 'group'}
            aria-label="勋章类型"
          >
            {RANKING_SCOPES.map((item) => {
              const active = scopeFilter === item;
              return (
                <button
                  key={item}
                  type="button"
                  role={pcLayout ? 'tab' : undefined}
                  aria-selected={pcLayout ? active : undefined}
                  aria-pressed={pcLayout ? undefined : active}
                  className={active ? 'is-active' : undefined}
                  onClick={() => pickScope(item)}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <PeriodMenu period={period} onChange={setPeriod} />
          </div>
          <div
            className={pcLayout ? 'c-incentive-cat-tabs' : 'c-incentive-cat-scroll'}
            role={pcLayout ? 'tablist' : 'group'}
            aria-label="勋章分类"
          >
            {['全部', ...categories].map((item) => {
              const active = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  role={pcLayout ? 'tab' : undefined}
                  aria-selected={pcLayout ? active : undefined}
                  aria-pressed={pcLayout ? undefined : active}
                  className={active ? 'is-active' : undefined}
                  onClick={() => pickCategory(item)}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
        {badge ? (
        <>
        <div className={`mobile-medal-tab-strip${pcLayout ? ' is-scroll' : ''}`} role="tablist" aria-label="选择勋章" ref={stripRef}>
          {visible.map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={item.badge.name === badge.name}
              className={item.badge.name === badge.name ? 'active' : ''}
              key={item.badge.id}
              onClick={() => {
                setSelected(item.badge.name);
                goH5Incentive('ranking', item.badge.id);
              }}
            >
              <BadgeArt badge={item.badge} />
              <span>{item.badge.name}</span>
            </button>
          ))}
        </div>
        <header className="mobile-medal-recipient-heading">
          <div>
            <strong>{badge.name}</strong>
            <span>获得该勋章的全部员工</span>
          </div>
          <b>{people.length} 人</b>
        </header>
        <div className="mobile-medal-recipient-list">
          {people.map((person) => (
            <button
              type="button"
              className="mobile-medal-recipient-row"
              aria-label={badge.scope === '公司表彰' ? `查看${person.name}的光荣事迹` : `查看${person.name}的个人勋章墙`}
              key={person.id}
              onClick={() => {
                if (badge.scope === '公司表彰') {
                  const entry = companyHonoree(period, month, badge.name, person.name);
                  if (entry) onCompanyDetail(entry);
                  return;
                }
                onPersonHonor({
                  id: person.id,
                  name: person.name,
                  department: person.department,
                  highlightedBadgeName: badge.name,
                  highlightedReason: person.latestReason,
                  highlightedAt: person.latestAt,
                });
              }}
            >
              <b>{person.rank}</b>
              <PersonPhoto name={person.name} size={44} />
              <div className="mobile-medal-recipient-id">
                <strong>{person.name}</strong>
                <small>{person.department}</small>
              </div>
              <em>
                获得 {person.count}
                <i>次</i>
              </em>
            </button>
          ))}
          {!people.length && <div className="medal-recipient-empty">暂无员工获得该勋章</div>}
        </div>
        </>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该分类下暂无勋章" />
        )}
      </section>
    </main>
  );
}

function mineBadgeCount(badge: IncentiveH5Badge): number {
  if (!INCENTIVE_H5_ACQUIRED[badge.id]) return 0;
  if (badge.scope === '同事认可') {
    const total = (INCENTIVE_H5_RECEIPTS[badge.id] ?? []).reduce((sum, row) => sum + row.count, 0);
    return Math.max(total, 1);
  }
  const n = INCENTIVE_H5_RECORDS.filter(
    (row) => row.receiver === ME_NAME && row.badge === badge.name && row.status === '已发放',
  ).length;
  return Math.max(n, 1);
}

export function IncentiveProfile({ layout = 'h5', statsOnly = false }: { layout?: 'h5' | 'pc'; statsOnly?: boolean }) {
  const pc = layout === 'pc';
  const me = INCENTIVE_H5_PEOPLE.find((item) => item.id === ME_ID) ?? INCENTIVE_H5_PEOPLE[0];
  const [scope, setScope] = useState<IncentiveH5Scope>('同事认可');
  const scoped = INCENTIVE_H5_BADGES.filter((item) => item.scope === scope);
  const earned = scoped.filter((item) => INCENTIVE_H5_ACQUIRED[item.id]);
  const allEarned = INCENTIVE_H5_BADGES.filter((item) => INCENTIVE_H5_ACQUIRED[item.id]);
  const totalPoints = allEarned.reduce((sum, item) => sum + item.points * mineBadgeCount(item), 0);
  const categories = Array.from(new Set(scoped.map((item) => item.category)));
  const [picked, setPicked] = useState(0);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<IncentiveH5Badge>();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const current = earned[picked];

  const switchScope = (next: IncentiveH5Scope) => {
    setScope(next);
    setPicked(0);
    setOpenCats({});
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({ left: 0 });
    });
  };

  const pick = (index: number, scroll = true) => {
    setPicked(index);
    if (!scroll) return;
    const slide = scrollerRef.current?.querySelector(`[data-badge-slide="${index}"]`);
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const categoryGrid = (showAll: boolean) =>
    categories.map((category) => {
      const items = scoped
        .filter((item) => item.category === category)
        .sort((a, b) => Number(!!INCENTIVE_H5_ACQUIRED[b.id]) - Number(!!INCENTIVE_H5_ACQUIRED[a.id]));
      const expanded = showAll || !!openCats[category];
      const visible = items.length > 3 && !expanded ? items.slice(0, 3) : items;
      return (
        <section className="honor-badge-category" key={category}>
          <header className="honor-badge-category-head">
            <h3>{category}</h3>
            {!showAll && items.length > 3 && (
              <button
                type="button"
                className="honor-badge-category-toggle"
                aria-expanded={expanded}
                aria-label={expanded ? `收起${category}` : `展开${category}`}
                onClick={() => setOpenCats((prev) => ({ ...prev, [category]: !prev[category] }))}
              >
                <DownOutlined rotate={expanded ? 180 : 0} />
              </button>
            )}
            {showAll ? <span>{items.filter((item) => INCENTIVE_H5_ACQUIRED[item.id]).length}/{items.length}</span> : null}
          </header>
          <div className="honor-badge-grid">
            {visible.map((item) => {
              const at = INCENTIVE_H5_ACQUIRED[item.id];
              const count = mineBadgeCount(item);
              const earnedIndex = earned.findIndex((row) => row.id === item.id);
              const active = !pc && earnedIndex >= 0 && earnedIndex === picked;
              return (
                <button
                  type="button"
                  className={`${active ? 'is-active' : ''} ${at ? '' : 'is-locked'}`}
                  key={item.id}
                  onClick={() => {
                    if (!pc && earnedIndex >= 0) pick(earnedIndex);
                    setDetail(item);
                  }}
                >
                  <span className="honor-badge-grid-medal">
                    <BadgeArt badge={item} locked={!at} />
                    {!at && <span className="honor-badge-lock-mask" aria-hidden />}
                  </span>
                  <b>{item.name}</b>
                  {count > 1 ? (
                    <Tag variant="filled" className="honor-badge-count-tag">
                      {count}次
                    </Tag>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      );
    });

  const detailLayer = pc ? (
    <Modal
      className="c-incentive-pc-badge-modal"
      wrapClassName="c-incentive-pc-badge-modal"
      centered
      destroyOnHidden
      open={!!detail}
      title={detail?.name}
      footer={
        <Button onClick={() => setDetail(undefined)}>关闭</Button>
      }
      onCancel={() => setDetail(undefined)}
      width={480}
    >
      {detail && <BadgeDetail badge={detail} acquiredAt={INCENTIVE_H5_ACQUIRED[detail.id] ?? ''} />}
    </Modal>
  ) : (
    <Drawer
      title="勋章详情"
      placement="right"
      width="100%"
      open={!!detail}
      onClose={() => setDetail(undefined)}
      getContainer={false}
      rootStyle={{ position: 'absolute' }}
      className="mobile-badge-detail-drawer"
    >
      {detail && <BadgeDetail badge={detail} acquiredAt={INCENTIVE_H5_ACQUIRED[detail.id] ?? ''} />}
    </Drawer>
  );

  if (pc) {
    return (
      <>
        <main className="c-incentive-pc-profile honor-badge-collection" data-badge-detail="modal">
          <section className={`c-incentive-pc-profile-hero${statsOnly ? ' is-stats' : ''}`}>
            {statsOnly ? null : (
              <>
                <PersonPhoto name={me.name} size={72} />
                <div>
                  <h2>我的勋章</h2>
                  <p>
                    {me.name} · {me.department}
                  </p>
                </div>
              </>
            )}
            <dl>
              <div>
                <dd>{allEarned.length}</dd>
                <dt>勋章</dt>
              </div>
              <div>
                <dd>{totalPoints}</dd>
                <dt>累计积分</dt>
              </div>
            </dl>
          </section>
          <div className="c-incentive-pc-profile-tabs" role="tablist" aria-label="勋章类型">
            {(['公司表彰', '同事认可'] as const).map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={scope === item}
                className={scope === item ? 'is-active' : ''}
                key={item}
                onClick={() => switchScope(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {categoryGrid(true)}
        </main>
        {detailLayer}
      </>
    );
  }

  return (
    <>
      <main className="honor-badge-collection" data-badge-detail="drawer">
        <div className="honor-badge-tabs" role="tablist" aria-label="勋章类型">
          {(['公司表彰', '同事认可'] as const).map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={scope === item}
              className={scope === item ? 'is-active' : ''}
              key={item}
              onClick={() => switchScope(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {earned.length ? (
          <>
            <div className="honor-badge-carousel-clip">
              <div
                className="honor-badge-carousel"
                ref={scrollerRef}
                onScroll={(event) => {
                  const el = event.currentTarget;
                  const slides = Array.from(el.querySelectorAll<HTMLElement>('[data-badge-slide]'));
                  const center = el.scrollLeft + el.clientWidth / 2;
                  let best = 0;
                  let dist = Number.POSITIVE_INFINITY;
                  slides.forEach((slide, index) => {
                    const d = Math.abs(center - (slide.offsetLeft + slide.offsetWidth / 2));
                    if (d < dist) {
                      dist = d;
                      best = index;
                    }
                  });
                  if (best !== picked) setPicked(best);
                }}
              >
                {earned.map((item, index) => (
                  <button
                    type="button"
                    className={`honor-badge-slide${index === picked ? ' is-active' : ''}`}
                    data-badge-slide={index}
                    key={item.id}
                    onClick={() => (index === picked ? setDetail(item) : pick(index))}
                  >
                    <span className="honor-badge-slide-ring">
                      <span className="honor-badge-slide-medal">
                        <BadgeArt badge={item} />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {current && (
              <div className="honor-badge-caption">
                <strong>{current.name}</strong>
                <span>
                  获得于 {INCENTIVE_H5_ACQUIRED[current.id]}
                  <em>+{current.points} 积分</em>
                </span>
              </div>
            )}
            <div className="honor-badge-divider" />
          </>
        ) : null}
        {categoryGrid(false)}
      </main>
      {detailLayer}
    </>
  );
}

export function IncentiveMessages({
  viewed,
  onOpenAward,
}: {
  viewed: boolean;
  onOpenAward: () => void;
}) {
  const record = INCENTIVE_H5_RECORDS.find((item) => item.receiver === ME_NAME && item.status === '已发放') ?? INCENTIVE_H5_RECORDS[0];
  const badge = INCENTIVE_H5_BADGES.find((item) => item.name === record.badge) ?? INCENTIVE_H5_BADGES[0];
  const giver = INCENTIVE_H5_PEOPLE.find((item) => item.name === record.giver);
  return (
    <section className="recognition-im-conversation mobile">
      <header className="recognition-im-chat-header">
        <span className="recognition-im-app-icon">🏅</span>
        <div>
          <strong>即时激励助手</strong>
          <small>勋章与积分通知</small>
        </div>
        <Tag color="blue">官方</Tag>
      </header>
      <div className="recognition-im-chat-body">
        <time>今天 09:32</time>
        <div className="recognition-im-message-row">
          <Avatar size={34} style={{ background: giver?.color ?? '#D97706' }}>
            {record.giver.slice(0, 1)}
          </Avatar>
          <div>
            <small>{record.giver}</small>
            <button
              type="button"
              className={`recognition-im-award-card ${viewed ? 'is-read' : 'is-unread'}`}
              onClick={onOpenAward}
              aria-label={`查看${record.badge}勋章`}
            >
              <span className="recognition-im-award-copy">
                <em>{viewed ? '勋章通知' : '你收到一枚新勋章'}</em>
                <strong>{record.badge}</strong>
                <small>{record.giver}认可了你的优秀行为</small>
              </span>
              <span className="recognition-im-award-medal">
                <BadgeArt badge={badge} />
              </span>
              <span className="recognition-im-award-footer">
                <b>+{record.points} 积分</b>
                <i>
                  点击查看 <RightOutlined />
                </i>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function IncentiveAwardView({ isNew, onBack }: { isNew: boolean; onBack: () => void }) {
  const record = INCENTIVE_H5_RECORDS.find((item) => item.receiver === ME_NAME && item.status === '已发放') ?? INCENTIVE_H5_RECORDS[0];
  const badge = INCENTIVE_H5_BADGES.find((item) => item.name === record.badge) ?? INCENTIVE_H5_BADGES[0];
  const giver = INCENTIVE_H5_PEOPLE.find((item) => item.name === record.giver);
  return (
    <section className={`recognition-award-view mobile ${isNew ? 'is-new' : 'is-viewed'}`}>
      <header className="recognition-award-full-top">
        <Button type="text" shape="circle" icon={<LeftOutlined />} onClick={onBack} aria-label="返回消息" />
        <span>勋章详情</span>
        <Button type="text" shape="circle" icon={<ShareAltOutlined />} aria-label="分享勋章" />
      </header>
      <div className="recognition-award-celebration">
        <span className="recognition-award-kicker">{isNew ? '恭喜你获得新勋章' : '已获得勋章'}</span>
        <div className="recognition-award-medal-stage">
          <i className="recognition-award-ring" />
          <BadgeArt badge={badge} />
        </div>
        <h1>{record.badge}</h1>
        <p>{badge.definition}</p>
        <div className="recognition-award-meta">
          <strong>+{record.points} 积分</strong>
          <span>{record.time} 获得</span>
        </div>
        <small className="recognition-award-recorded">
          <CheckCircleOutlined /> 已记入个人荣誉档案
        </small>
      </div>
      <div className="recognition-award-detail-card">
        <section>
          <span>获得理由</span>
          <p>{record.description}</p>
        </section>
        <dl>
          <div>
            <dt>发放人</dt>
            <dd>
              <Avatar size={24} style={{ background: giver?.color ?? '#D97706' }}>
                {record.giver.slice(0, 1)}
              </Avatar>
              {record.giver}
            </dd>
          </div>
          <div>
            <dt>获得时间</dt>
            <dd>{record.time}</dd>
          </div>
        </dl>
        <div className="recognition-award-actions">
          <Button size="large" block onClick={onBack}>
            返回消息
          </Button>
        </div>
      </div>
    </section>
  );
}

export function IncentiveCompanyStory({ entry, onBack }: { entry: CompanyStory; onBack: () => void }) {
  const badge = INCENTIVE_H5_BADGES.find((item) => item.name === entry.badge) ?? INCENTIVE_H5_BADGES[0];
  return (
    <main className="mobile-company-honor-story-page">
      <MobileBackbar title="公司表彰" onBack={onBack} />
      <article className="company-honor-story">
        <header className="company-honor-story-hero">
          <span className="company-honor-story-kicker">公司表彰</span>
          <div className="company-honor-story-person">
            <span className="company-honor-story-portrait-stage">
              <PersonPhoto name={entry.name} size={180} className="company-honor-story-portrait" />
              <BadgeArt badge={badge} className="company-honor-story-medal" />
            </span>
            <div className="company-honor-story-identity">
              <small>{entry.department}</small>
              <h1>{entry.name}</h1>
              <strong>{entry.badge}</strong>
              <p>
                {entry.month.replace(/^\d{4}\s*年\s*/, '')} · +{entry.points} 积分
              </p>
            </div>
          </div>
        </header>
        <div className="company-honor-story-content">
          <section className="company-honor-story-main">
            <span>光荣事迹</span>
            <h2>荣誉源于每一次出色行动</h2>
            <p>{entry.reason}</p>
          </section>
          <section className="company-honor-story-note">
            <span>勋章说明</span>
            <strong>{badge.name}</strong>
            <p>{badge.description}</p>
          </section>
        </div>
      </article>
    </main>
  );
}

function formatHonorYmd(time: string) {
  const [year, month, day] = time.slice(0, 10).split('-');
  if (!year || !month || !day) return time.slice(0, 10);
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function IncentivePersonHonor({
  target,
  layout = 'h5',
  hideHero = false,
  heading = '勋章墙',
}: {
  target: PersonTarget;
  layout?: 'h5' | 'pc';
  hideHero?: boolean;
  heading?: string;
}) {
  const records = personHonorRecords(target);
  const points = records.reduce((sum, item) => sum + item.points, 0);
  const months = Array.from(new Set(records.map((item) => item.time.slice(0, 7))));
  return (
    <main className="mobile-person-honor-page">
      <section className={`employee-honor-wall ${layout === 'pc' ? 'desktop-employee-honor-wall' : 'mobile-employee-honor-wall'}`}>
        {hideHero ? null : (
        <header className="employee-honor-wall-hero">
          <PersonPhoto name={target.name} size={68} />
          <div className="employee-honor-wall-identity">
            {layout === 'h5' && <span>个人荣誉档案</span>}
            <div className="employee-honor-wall-name-row">
              <div>
                <h1>{target.name}</h1>
                <p>{target.department}</p>
              </div>
              {layout === 'pc' && (
                <dl>
                  <div>
                    <dt>{records.length}</dt>
                    <dd>勋章</dd>
                  </div>
                  <div>
                    <dt>{points}</dt>
                    <dd>累计积分</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
          {layout === 'h5' && (
            <dl>
              <div>
                <dt>{records.length}</dt>
                <dd>勋章</dd>
              </div>
              <div>
                <dt>{points}</dt>
                <dd>累计积分</dd>
              </div>
            </dl>
          )}
        </header>
        )}
        <div className="employee-honor-wall-heading">
          <h2>{heading}</h2>
        </div>
        {records.length ? (
          <div className="employee-honor-months">
            {months.map((month) => {
              const items = records.filter((item) => item.time.startsWith(month));
              const [year, mon] = month.split('-');
              return (
                <section className="employee-honor-month" key={month}>
                  <header>
                    <strong>
                      {year} 年 {Number(mon)} 月
                    </strong>
                    <span>{items.length} 条记录</span>
                  </header>
                  <div>
                    {items.map((item) => (
                      <article className="employee-honor-record" key={item.id}>
                        <BadgeArt badge={item.badge} />
                        <div className="employee-honor-record-main">
                          <header>
                            <h3>{item.badge.name}</h3>
                            <strong>+{item.points} 积分</strong>
                          </header>
                          <p>{item.reason}</p>
                          <footer>
                            <span>{item.source}</span>
                            <time>{formatHonorYmd(item.time)}</time>
                          </footer>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="employee-honor-empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无有效获奖记录" />
          </div>
        )}
      </section>
    </main>
  );
}
