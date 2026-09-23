import { useState } from 'react';
import {
  HomeOutlined,
  MessageOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { goH5Back, goH5Incentive, parseIncentiveH5Hash, type CEndSurface } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { companyStoryById, personTargetById } from './incentiveH5Ranking';
import {
  IncentiveAwardView,
  IncentiveCompanyStory,
  IncentiveHome,
  IncentiveIssue,
  IncentiveMessages,
  IncentivePcAside,
  IncentivePersonHonor,
  IncentiveProfile,
  IncentiveRanking,
} from './H5IncentiveScreens';
import '../../activities/styles.css';
import './incentive-h5.css';
import './incentive-h5-extra.css';
import './incentive-h5-embed.css';
import './incentive-pc.css';

export function H5IncentiveApp({ hash, surface = 'h5' }: { hash?: string; surface?: CEndSurface }) {
  const route = parseIncentiveH5Hash(hash ?? (typeof window === 'undefined' ? '' : window.location.hash));
  const [viewed, setViewed] = useState(false);
  const [awardNew, setAwardNew] = useState(false);
  const pc = surface === 'pc';

  const person = route.page === 'person' && route.id ? personTargetById(route.id) : undefined;
  const company = route.page === 'company' && route.id ? companyStoryById(route.id) : undefined;
  const screen =
    route.page === 'person' && !person
      ? 'home'
      : route.page === 'company' && !company
        ? 'ranking'
        : route.page;
  const tabActive = screen === 'messages' || screen === 'award' ? 'messages' : screen === 'profile' ? 'profile' : 'home';
  const showNav = screen === 'home' || screen === 'messages' || screen === 'profile';
  const showFab = screen === 'home';
  const shellTitle =
    screen === 'ranking'
      ? '热门勋章'
      : screen === 'person'
        ? '个人勋章墙'
        : screen === 'profile'
          ? '个人中心'
          : screen === 'issue'
            ? '发放勋章'
            : '即时激励';

  const pages = (
    <>
      {screen === 'home' && (
        <IncentiveHome
          layout={pc ? 'pc' : 'h5'}
          onRanking={(badgeId) => goH5Incentive('ranking', badgeId)}
          onPersonHonor={(target) => goH5Incentive('person', target.id)}
        />
      )}
      {screen === 'issue' && <IncentiveIssue layout={pc ? 'pc' : 'h5'} />}
      {screen === 'ranking' && (
        <IncentiveRanking
          layout={pc ? 'pc' : 'h5'}
          scope="同事认可"
          initialBadgeId={route.id}
          onCompanyDetail={(entry) => goH5Incentive('company', entry.id)}
          onPersonHonor={(target) => goH5Incentive('person', target.id)}
        />
      )}
      {screen === 'profile' && <IncentiveProfile layout={pc ? 'pc' : 'h5'} />}
      {screen === 'messages' && (
        <IncentiveMessages
          viewed={viewed}
          onOpenAward={() => {
            setAwardNew(!viewed);
            setViewed(true);
            goH5Incentive('award');
          }}
        />
      )}
      {screen === 'award' && <IncentiveAwardView isNew={awardNew} onBack={goH5Back} />}
      {screen === 'company' && company && <IncentiveCompanyStory entry={company} onBack={goH5Back} />}
      {screen === 'person' && person && <IncentivePersonHonor target={person} layout={pc ? 'pc' : 'h5'} />}
    </>
  );

  const pcNav = (
    <nav className="c-incentive-pc-nav" aria-label="员工端主导航">
      <button className={tabActive === 'home' ? 'is-active' : ''} type="button" onClick={() => goH5Incentive('home')}>
        <HomeOutlined />
        首页
      </button>
      <button
        className={`${tabActive === 'messages' ? 'is-active' : ''} ${viewed ? '' : 'has-unread'}`}
        type="button"
        onClick={() => goH5Incentive('messages')}
      >
        <MessageOutlined />
        消息
      </button>
      <button className={tabActive === 'profile' ? 'is-active' : ''} type="button" onClick={() => goH5Incentive('profile')}>
        <UserOutlined />
        个人中心
      </button>
    </nav>
  );

  if (pc) {
    return (
      <PcActivityShell className="is-incentive" title="即时激励" headerActions={pcNav}>
        <div className="c-incentive-h5 c-incentive-pc" aria-label="即时激励 PC">
          <div className="c-incentive-pc-layout">
            <div className="c-incentive-pc-main">{pages}</div>
            <IncentivePcAside />
          </div>
        </div>
      </PcActivityShell>
    );
  }

  return (
    <H5ActivityShell className="is-incentive" title={shellTitle} onBack={goH5Back}>
      <div className="c-incentive-h5" aria-label="即时激励 H5">
        <div className="mobile-app mobile-two-page-app">
          <div className="mobile-page-scroll">{pages}</div>
          {showFab && (
            <button
              type="button"
              className="mobile-home-floating-issue"
              aria-label="发放勋章"
              title="发放勋章"
              onClick={() => goH5Incentive('issue')}
            >
              <PlusOutlined />
            </button>
          )}
          {showNav && (
            <nav className="mobile-primary-nav mobile-home-profile-nav" aria-label="员工端主导航">
              <button className={tabActive === 'home' ? 'active' : ''} type="button" onClick={() => goH5Incentive('home')}>
                <HomeOutlined />
                <span>首页</span>
              </button>
              <button
                className={`${tabActive === 'messages' ? 'active' : ''} ${viewed ? '' : 'has-unread'}`}
                type="button"
                onClick={() => goH5Incentive('messages')}
              >
                <MessageOutlined />
                <span>消息</span>
              </button>
              <button className={tabActive === 'profile' ? 'active' : ''} type="button" onClick={() => goH5Incentive('profile')}>
                <UserOutlined />
                <span>个人中心</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </H5ActivityShell>
  );
}
