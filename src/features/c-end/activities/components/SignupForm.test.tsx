import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { addSignupField, defaultSignupFields, setSignupFieldGroups } from '../../../activities/model/signupFields';
import { initialActivities } from '../../../activities/model/activity';
import { SignupForm } from './SignupForm';

describe('SignupForm', () => {
  it('only asks for signup type when fields are all system profile fields', () => {
    const html = renderToStaticMarkup(
      <SignupForm types={['个人报名', '团体报名']} fields={defaultSignupFields()} onCancel={() => undefined} onConfirm={() => undefined} />,
    );
    expect(html).toContain('报名类型');
    expect(html).not.toContain('姓名');
    expect(html).not.toContain('手机号');
  });

  it('renders configured extra fields and prefills system values', () => {
    const fields = addSignupField(addSignupField(defaultSignupFields(), '部门'), '邮箱');
    const html = renderToStaticMarkup(
      <SignupForm types={['个人报名']} fields={fields} onCancel={() => undefined} onConfirm={() => undefined} />,
    );
    expect(html).toContain('姓名');
    expect(html).toContain('value="陈产品"');
    expect(html).toContain('部门');
    expect(html).toContain('value="华东大区"');
    expect(html).toContain('邮箱');
    expect(html).not.toContain('报名类型');
  });

  it('renders 分组选择 as checkboxes', () => {
    const fields = setSignupFieldGroups(addSignupField(defaultSignupFields(), '分组选择'), '分组选择', [
      { name: 'A组', limit: 5 },
      { name: 'B组', limit: 5 },
    ]);
    const html = renderToStaticMarkup(
      <SignupForm types={['个人报名']} fields={fields} onCancel={() => undefined} onConfirm={() => undefined} />,
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('A组');
    expect(html).toContain('B组');
    expect(html).not.toContain('name="分组选择" type="radio"');
  });

  it('puts required 报名分组 between sessions and 报名信息, not inside profile fields', () => {
    const fields = setSignupFieldGroups(addSignupField(addSignupField(defaultSignupFields(), '分组选择'), '邮箱'), '分组选择', [
      { name: 'A组', limit: 5 },
      { name: 'B组', limit: 5 },
    ]);
    const html = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={fields}
        scheduleType="series"
        sessions={[
          { id: 's1', startAt: '2026-09-01 09:00', endAt: '2026-09-01 12:00' },
          { id: 's2', startAt: '2026-09-08 09:00', endAt: '2026-09-08 12:00' },
        ]}
        now={Date.parse('2026-08-01T12:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(html).toContain('报名分组 *');
    expect(html).toContain('signup-card-groups');
    expect(html.indexOf('参加场次')).toBeLessThan(html.indexOf('报名分组'));
    expect(html.indexOf('报名分组')).toBeLessThan(html.indexOf('报名信息'));
    expect(html.indexOf('name="分组选择"')).toBeLessThan(html.indexOf('报名信息'));
    expect(html.indexOf('报名信息')).toBeLessThan(html.indexOf('邮箱'));
    expect(html.slice(html.indexOf('报名信息'))).not.toContain('name="分组选择"');
  });

  it('hides 报名分组 when the activity did not enable groups', () => {
    const html = renderToStaticMarkup(
      <SignupForm types={['个人报名']} fields={defaultSignupFields()} onCancel={() => undefined} onConfirm={() => undefined} />,
    );
    expect(html).not.toContain('报名分组');
    expect(html).not.toContain('signup-card-groups');
  });

  it('asks which sessions to attend for series activities', () => {
    const html = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={defaultSignupFields()}
        scheduleType="series"
        sessions={[
          { id: 's1', startAt: '2026-09-01 09:00', endAt: '2026-09-01 12:00' },
          { id: 's2', startAt: '2026-09-08 09:00', endAt: '2026-09-08 12:00' },
        ]}
        now={Date.parse('2026-08-01T12:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(html).toContain('参加场次');
    expect(html).toContain('第 1 场 09-01 09:00 ~ 09-01 12:00');
    expect(html).toContain('type="checkbox"');
  });

  it('hides ended sessions and disables live sessions whose signup window has closed', () => {
    const html = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={defaultSignupFields()}
        scheduleType="series"
        sessions={[
          { id: 'ended', startAt: '2020-01-01 09:00', endAt: '2020-01-01 12:00' },
          { id: 'live', startAt: '2026-08-25 09:00', endAt: '2026-08-25 18:00' },
          { id: 'next', startAt: '2099-09-01 09:00', endAt: '2099-09-01 12:00' },
        ]}
        signupStartAt="2019-01-01 09:00"
        signupEndAt="2099-09-01 09:00"
        signupHoursBefore={0}
        now={Date.parse('2026-08-25T12:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(html).not.toContain('2020-01-01');
    expect(html).toContain('已截止');
    expect(html).toContain('disabled');
    expect(html).toContain('2099-09-01');
  });

  it('collapses signup sessions past five until expanded', () => {
    const sessions = Array.from({ length: 7 }, (_, index) => ({
      id: `s${index}`,
      startAt: `2026-09-0${index + 1} 19:00`,
      endAt: `2026-09-0${index + 1} 21:00`,
    }));
    const collapsed = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={defaultSignupFields()}
        scheduleType="recurring"
        sessions={sessions}
        now={Date.parse('2026-08-26T15:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(collapsed).toContain('value="s0"');
    expect(collapsed).toContain('value="s4"');
    expect(collapsed).not.toContain('value="s5"');
    expect(collapsed).not.toContain('value="s6"');
    expect(collapsed).toContain('展开全部场次');

    const expanded = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={defaultSignupFields()}
        scheduleType="recurring"
        sessions={sessions}
        sessionsExpanded
        now={Date.parse('2026-08-26T15:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(expanded).toContain('value="s5"');
    expect(expanded).toContain('value="s6"');
    expect(expanded).toContain('收起场次');
  });

  it('shows remaining seats for each session', () => {
    const basketball = initialActivities.find((item) => item.id === 26)!;
    const html = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={defaultSignupFields()}
        scheduleType={basketball.scheduleType}
        sessions={basketball.sessions}
        activityId={26}
        quotaLimit={50}
        now={Date.parse('2026-08-27T11:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(html).toContain('余48位');
    expect(html).toContain('余49位');
  });

  it('separates sessions and signup info into cards', () => {
    const fields = addSignupField(addSignupField(defaultSignupFields(), '部门'), '年龄');
    const html = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={fields}
        scheduleType="series"
        sessions={[
          { id: 's1', startAt: '2026-09-01 09:00', endAt: '2026-09-01 12:00' },
          { id: 's2', startAt: '2026-09-08 09:00', endAt: '2026-09-08 12:00' },
        ]}
        now={Date.parse('2026-08-01T12:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect((html.match(/c-signup-card/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('报名信息');
    expect(html.indexOf('参加场次')).toBeLessThan(html.indexOf('报名信息'));
    expect(html.indexOf('参加场次')).toBeLessThan(html.indexOf('姓名'));
  });

  it('prefills picked sessions when adjusting an existing signup', () => {
    const html = renderToStaticMarkup(
      <SignupForm
        types={['个人报名']}
        fields={defaultSignupFields()}
        scheduleType="series"
        sessions={[
          { id: 's1', startAt: '2026-09-01 09:00', endAt: '2026-09-01 12:00' },
          { id: 's2', startAt: '2026-09-08 09:00', endAt: '2026-09-08 12:00' },
        ]}
        initialAnswers={{ 场次: 's1' }}
        mode="adjust"
        now={Date.parse('2026-08-01T12:00:00')}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(html).toContain('立即报名');
    expect(html).toMatch(/value="s1"[^>]*checked|checked[^>]*value="s1"/);
    expect(html).not.toMatch(/value="s2"[^>]*checked|checked[^>]*value="s2"/);
    expect(html).toContain('确认报名');
  });
});
