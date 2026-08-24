import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { addSignupField, defaultSignupFields } from '../../../activities/model/signupFields';
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
});
