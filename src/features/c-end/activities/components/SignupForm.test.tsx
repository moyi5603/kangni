import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { addSignupField, defaultSignupFields, setSignupFieldGroups } from '../../../activities/model/signupFields';
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
    expect(html).toContain('value="职能中心"');
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

  it('only lists the next five unfinished sessions', () => {
    const sessions = Array.from({ length: 7 }, (_, index) => ({
      id: `s${index}`,
      startAt: `2026-09-0${index + 1} 19:00`,
      endAt: `2026-09-0${index + 1} 21:00`,
    }));
    const html = renderToStaticMarkup(
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
    expect(html).toContain('s0');
    expect(html).toContain('s4');
    expect(html).not.toContain('s5');
    expect(html).not.toContain('s6');
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
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(html).toContain('调整报名');
    expect(html).toMatch(/value="s1"[^>]*checked|checked[^>]*value="s1"/);
    expect(html).not.toMatch(/value="s2"[^>]*checked|checked[^>]*value="s2"/);
    expect(html).not.toContain('确认报名');
  });
});
