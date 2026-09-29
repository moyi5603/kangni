import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { H5SetupPage } from './H5SetupPage';

describe('H5 setup page', () => {
  it('follows 一点知识 settings list', () => {
    const html = renderToStaticMarkup(<H5SetupPage />);
    expect(html).toContain('设置');
    expect(html).toContain('账号与安全');
    expect(html).toContain('多语言');
    expect(html).toContain('中文(简体)');
    expect(html).toContain('系统权限管理');
    expect(html).toContain('隐私协议');
    expect(html).toContain('个人信息收集清单');
    expect(html).toContain('第三方共享个人信息清单');
    expect(html).toContain('退出登录');
    expect(html).toContain('class="c-h5-shell is-setup');
    expect(html).not.toContain('数字身份设置');
    expect(html).not.toContain('版本更新');
  });
});