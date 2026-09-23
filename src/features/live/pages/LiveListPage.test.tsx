import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LiveListPage } from './LiveListPage';
import { LiveFormPage } from './LiveFormPage';
import { LiveDetailPage } from './LiveDetailPage';
import { __resetLiveStoreForTests } from '../model/liveStore';

const noop = () => {};

describe('LiveListPage', () => {
  beforeEach(() => {
    __resetLiveStoreForTests();
  });

  it('lists live broadcasts with cover, time range, derived status and row actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <LiveListPage onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('直播管理');
    expect(html).toContain('新建直播');
    expect(html).toContain('季度全员大会直播');
    expect(html).toContain('直播中');
    expect(html).toContain('预告');
    expect(html).toContain('回放');
    expect(html).toContain('已结束');
    expect(html).toContain('讲师');
    expect(html).toContain('直播时间');
    expect(html).toContain('观看人数');
    expect(html).toContain('封面');
    expect(html).toContain('详情');
    expect(html).toContain('编辑');
    expect(html).toContain('删除');
  });
});

describe('LiveFormPage', () => {
  beforeEach(() => {
    __resetLiveStoreForTests();
  });

  it('renders all required fields for creating a live', () => {
    const html = renderToStaticMarkup(
      <App>
        <LiveFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建直播');
    expect(html).toContain('直播名称');
    expect(html).toContain('封面');
    expect(html).toContain('讲师姓名');
    expect(html).toContain('讲师手机号');
    expect(html).toContain('直播时间');
    expect(html).toContain('直播描述');
    expect(html).toContain('开启可见范围');
    expect(html).toContain('保存并生成链接');
  });

  it('shows scope options when visibility is enabled in edit mode', () => {
    const html = renderToStaticMarkup(
      <App>
        <LiveFormPage mode="edit" recordId="2" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('编辑直播');
    expect(html).toContain('范围类型');
    expect(html).toContain('全员');
    expect(html).toContain('按部门');
    expect(html).toContain('导入');
    expect(html).toContain('选择部门');
  });
});

describe('LiveDetailPage', () => {
  beforeEach(() => {
    __resetLiveStoreForTests();
  });

  it('shows links, comments, viewers and replay tabs', () => {
    const html = renderToStaticMarkup(
      <App>
        <LiveDetailPage recordId="1" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('季度全员大会直播');
    expect(html).toContain('讲师端链接');
    expect(html).toContain('学员端链接');
    expect(html).toContain('https://live.kangni.cn/lecturer/LV0001');
    expect(html).toContain('https://live.kangni.cn/watch/LV0001');
    expect(html).toContain('评论');
    expect(html).toContain('观看成员');
    expect(html).toContain('视频回放');
    expect(html).toContain('信号很稳定，给会务组点赞');
    expect(html).toContain('李工');
  });

  it('shows empty replay for lives without replay', () => {
    const html = renderToStaticMarkup(
      <App>
        <LiveDetailPage recordId="4" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('本场直播未开启回放');
  });

  it('renders empty state for unknown live', () => {
    const html = renderToStaticMarkup(
      <App>
        <LiveDetailPage recordId="999" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('直播不存在或已删除');
  });
});
