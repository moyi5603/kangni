import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SignupGroupsEditor } from './SignupGroupsEditor';

describe('SignupGroupsEditor', () => {
  it('stacks groups as labeled middle-size rows without decorative checkboxes', () => {
    const html = renderToStaticMarkup(
      <App>
        <SignupGroupsEditor
          groups={[
            { name: '技术组', limit: 36 },
            { name: '产品组', limit: 24 },
          ]}
          signupTotalLimit={60}
        />
      </App>,
    );
    expect(html).toContain('value="技术组"');
    expect(html).toContain('value="产品组"');
    expect(html).toContain('activity-signup-groups');
    expect(html).toContain('activity-signup-groups-name');
    expect(html).toContain('activity-unit-compact');
    expect(html).toContain('aria-label="删除分组 技术组"');
    expect(html).toContain('添加分组');
    expect(html).not.toContain('signup-field-choices');
    expect(html).not.toContain('ant-checkbox');
    expect(html).not.toContain('ant-input-sm');
    expect(html).not.toContain('ant-input-number-sm');
  });
});
