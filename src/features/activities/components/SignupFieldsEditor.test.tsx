import { App, Form } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { addSignupField, defaultSignupFields, setSignupFieldGroups } from '../model/signupFields';
import { SignupFieldsEditor } from './SignupFieldsEditor';

describe('SignupFieldsEditor groups', () => {
  it('keeps 分组选择 out of the palette and selected list', () => {
    const fields = setSignupFieldGroups(addSignupField(defaultSignupFields(), '分组选择'), '分组选择', [
      { name: '技术组', limit: 36 },
      { name: '产品组', limit: 24 },
    ]);
    const html = renderToStaticMarkup(
      <App>
        <Form>
          <SignupFieldsEditor value={fields} />
        </Form>
      </App>,
    );
    expect(html).not.toContain('value="技术组"');
    expect(html).not.toContain('signup-field-groups');
    expect(html).not.toContain('signup-fields-palette-label">分组选择');
  });
});
