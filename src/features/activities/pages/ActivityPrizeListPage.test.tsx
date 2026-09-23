import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getActivity } from '../model/activityStore';
import { findGroupSignupField } from '../model/signupFields';
import { visiblePrizeTargetTypes } from '../model/prizeGrant';
import { ActivityPrizeListPage } from './ActivityPrizeListPage';

describe('ActivityPrizeListPage grant targets', () => {
  it('enables 指定分组 for grouped activities and hides it otherwise', () => {
    const grouped = getActivity(2)!;
    const plain = getActivity(1)!;
    expect(findGroupSignupField(grouped.signupFields)).toBeTruthy();
    expect(findGroupSignupField(plain.signupFields)).toBeFalsy();
    expect(visiblePrizeTargetTypes(Boolean(findGroupSignupField(grouped.signupFields)))).toContain('指定分组');
    expect(visiblePrizeTargetTypes(Boolean(findGroupSignupField(plain.signupFields)))).not.toContain('指定分组');
    const html = renderToStaticMarkup(
      <App>
        <ActivityPrizeListPage activity={grouped} />
      </App>,
    );
    expect(html).toContain('发放奖励');
    expect(html).toContain('发放对象');
  });
});
