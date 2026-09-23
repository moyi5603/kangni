import { App, Form } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { defaultVoteV2Campaign, defaultVoteV2Contestant } from '../model/voteV2';
import { VoteV2PlayerForm, VoteV2PlayerView } from './VoteV2PlayerDrawer';

const campaign = defaultVoteV2Campaign({
  id: 1,
  name: '测试',
  startAt: '2026-09-01 09:00:00',
  endAt: '2026-09-10 18:00:00',
  createdAt: '2026-08-27 10:00:00',
});

describe('VoteV2PlayerForm', () => {
  it('uses plain text for option description, not rich text', () => {
    const html = renderToStaticMarkup(
      <App>
        <Form>
          <VoteV2PlayerForm campaign={campaign} nextOptionNo={5} />
        </Form>
      </App>,
    );
    expect(html).toContain('描述');
    expect(html).toContain('选项图片');
    expect(html).toContain('支持 bmp/png/jpeg/jpg/gif，建议比例4:3，不超过 5MB');
    expect(html).not.toContain('封面图');
    expect(html).toContain('选填');
    expect(html).toContain('默认自增编号');
    expect(html).not.toContain('rich-text');
    expect(html).not.toContain('选项描述参考模板');
    expect(html).not.toContain('vote-v2-intro-templates');
    expect(html).not.toContain('套用模板');
    expect(html).not.toContain('电话');
    expect(html).not.toContain('手机号');
  });

  it('defaults option number to next auto increment', () => {
    const html = renderToStaticMarkup(
      <App>
        <Form initialValues={{ optionNo: 7 }}>
          <VoteV2PlayerForm campaign={campaign} nextOptionNo={7} />
        </Form>
      </App>,
    );
    expect(html).toContain('value="7"');
    expect(html).toContain('默认自增编号');
  });
});

describe('VoteV2PlayerDrawer', () => {
  it('renders the option image in view mode instead of the file path', () => {
    const html = renderToStaticMarkup(
      <VoteV2PlayerView
        campaign={campaign}
        record={defaultVoteV2Contestant({
          id: 1,
          campaignId: 1,
          name: '张工',
          subtitle: '连续三年零事故',
          imageUrl: '/activities/onboarding.jpg',
          description: '连续三年零事故。',
        })}
      />,
    );
    expect(html).toContain('选项图片');
    expect(html).toContain('<img');
    expect(html).toContain('src="/activities/onboarding.jpg"');
    expect(html).toContain('vote-v2-option-preview');
    expect(html).not.toContain('>/activities/onboarding.jpg<');
  });
});
