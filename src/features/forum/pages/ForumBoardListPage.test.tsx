import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { ForumBoardListPage } from './ForumBoardListPage';
import { ForumBoardDetailPage } from './ForumBoardDetailPage';
import { ForumBoardFormPage } from './ForumBoardFormPage';
import { ForumRiskPage } from './ForumRiskPage';
import { ForumTagListPage } from './ForumTagListPage';
import { ForumTopicDetailPage } from './ForumTopicDetailPage';
import { ForumTopicListPage } from './ForumTopicListPage';
import { __resetForumStoreForTests } from '../model/forumStore';

const noop = () => {};

describe('forum admin pages', () => {
  beforeEach(() => {
    __resetForumStoreForTests();
  });

  it('lists public forums without mailbox boards', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardListPage kind="forum" onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('论坛列表');
    expect(html).toContain('二手论坛');
    expect(html).toContain('建议论坛');
    expect(html).not.toContain('建言献策');
    expect(html).toContain('新建论坛');
    expect(html).toContain('详情');
    expect(html).toContain('查看链接 二手论坛');
    expect(html).toContain('编辑');
    expect(html).not.toContain('>论坛图标<');
    expect(html).toContain('forum-board-name-cell');
    expect(html).not.toMatch(/>背景图</);
    expect(html).toContain('帖子标签');
    expect(html).toContain('闲置转让');
    expect(html).not.toContain('alt="二手论坛"');
    expect(html).toContain('alt="二手论坛图标"');
    expect(html).toMatch(/alt="二手论坛图标"[^>]*width="32"|width="32"[^>]*alt="二手论坛图标"/);
    expect([...html.matchAll(/search-field-label[^>]*>([^<]+)</g)].map((item) => item[1])).toEqual([]);
    const thead = html.match(/<thead[\s\S]*?<\/thead>/)?.[0] ?? '';
    expect(thead).not.toContain('匿名');
    expect(thead).not.toContain('可见范围');
  });

  it('renders forum detail with header cover and grouped copy', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardDetailPage kind="forum" recordId="1" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('论坛详情');
    expect(html).toContain('forum-board-title-row');
    expect(html).toContain('二手论坛');
    expect(html).toContain('alt="二手论坛 背景图"');
    expect(html).toMatch(/alt="二手论坛 背景图"[^>]*width="96"|width="96"[^>]*alt="二手论坛 背景图"/);
    expect(html).toContain('>背景图<');
    expect(html).toContain('alt="二手论坛图标"');
    expect(html).toMatch(/alt="二手论坛图标"[^>]*width="40"|width="40"[^>]*alt="二手论坛图标"/);
    expect(html).not.toContain('论坛规则');
    expect(html).not.toContain('简介与规则');
    expect(html).toContain('人体工学椅');
    expect(html).not.toContain('帖子管理');
    expect(html).toContain('帖子标签');
    expect(html).toContain('闲置转让');
    expect(html).toContain('查看链接 二手论坛');
    expect(html).toContain('编辑论坛 二手论坛');
    expect(html).not.toContain('公开私密');
  });

  it('renders mailbox detail sla as board-level not per chair', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardDetailPage kind="mailbox" recordId="3" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('信箱详情');
    expect(html).toContain('响应时效');
    expect(html).toContain('未开启');
    expect(html).toContain('林知夏');
    expect(html).toContain('负责人');
    expect(html).not.toContain('信箱负责人');
    expect(html).not.toContain('信箱标签');
    expect(html).not.toContain('建言管理');
    expect(html).toContain('希望完善员工意见保密处理流程');
    expect(html).not.toContain('人体工学椅');
    expect(html).not.toContain('所属板块');
    expect(html).not.toContain('建言献策');
    expect(html).toContain('员工体验');
    expect(html).not.toContain('员工体验建言');
    expect(html).toContain('回复人');
    expect(html).toContain('赵宁');
    expect(html).toContain('宋妍');
    expect(html).toContain('简介');
    expect(html).not.toContain('宗旨');
    expect(html).not.toContain('规则说明');
    expect(html).not.toContain('入口名称');
    expect(html).not.toContain('24小时');
    expect(html).not.toContain('48小时');
  });

  it('lists mailbox boards with handlers', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardListPage kind="mailbox" onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('信箱列表');
    expect(html).toContain('员工体验');
    expect(html).toContain('经营发展');
    expect(html).toContain('人才发展');
    expect(html).toContain('建言献策');
    expect(html).toContain('林知夏');
    expect(html).toContain('周明远');
    expect(html).toContain('赵宁');
    expect(html).toContain('负责人');
    expect(html).not.toContain('信箱名称');
    expect(html).not.toContain('信箱负责人');
    expect(html).not.toContain('信箱标签');
    expect(html).not.toContain('建言管理');
    expect(html).not.toContain('处理人');
    expect(html).toContain('新建信箱');
    expect(html).toContain('上移');
    expect(html).toContain('下移');
    expect(html).toContain('aria-label="上移信箱 员工体验"');
    expect(html).toContain('aria-label="下移信箱 建言献策"');
    expect(html).not.toContain('批量停用');
    expect(html).not.toContain('ant-table-selection');
    expect(html).not.toContain('查看链接');
    expect(html).not.toContain('所属板块');
    expect(html).not.toContain('员工体验建言');
    expect(html).not.toContain('>信箱图标<');
    expect(html).toContain('forum-board-name-cell');
    expect(html).toContain('alt="员工体验图标"');
    expect(html).toContain('alt="经营发展图标"');
    expect(html).toContain('alt="人才发展图标"');
    expect(html).toContain('alt="建言献策图标"');
    expect(html).not.toMatch(/>背景图</);
    expect(html).not.toContain('二手论坛');
    expect([...html.matchAll(/search-field-label[^>]*>([^<]+)</g)].map((item) => item[1])).toEqual([]);
    const thead = html.match(/<thead[\s\S]*?<\/thead>/)?.[0] ?? '';
    expect(thead).not.toContain('可见范围');
    expect(thead).not.toContain('匿名');
    expect(thead).toContain('负责人');
    expect(thead).toContain('名称');
  });

  it('lists forum topics on board detail without a standalone 帖子管理 page', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardDetailPage kind="forum" recordId="1" onBack={noop} onEdit={noop} onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('人体工学椅');
    expect(html).toContain('取消置顶 九成新人体工学椅转让，可自提');
    expect(html).toContain('帖子标签');
    expect(html).toContain('闲置转让');
    expect(html).toContain('查看链接 九成新人体工学椅转让，可自提');
    expect(html).toContain('指派回复人');
    expect(html).toContain('发帖人');
    expect(html).not.toContain('>发起人<');
    expect(html).not.toContain('search-field-label');
    expect(html).not.toContain('管理状态');
    expect(html).not.toContain('帖子管理');
    expect(html).not.toContain('跨部门项目职责边界');
    expect(html).not.toContain('论坛置顶');
    expect(html).not.toContain('首页置顶');
  });

  it('shows anonymous forum initiator as 匿名（真实姓名）', () => {
    const detail = renderToStaticMarkup(
      <App>
        <ForumTopicDetailPage kind="forum" recordId="2" onBack={noop} />
      </App>,
    );
    expect(detail).toContain('匿名（谢琳）');
    expect(detail).toContain('财务共享中心');
    expect(detail).not.toContain('陈某');
    const list = renderToStaticMarkup(
      <App>
        <ForumBoardDetailPage kind="forum" recordId="2" onBack={noop} onEdit={noop} onNavigate={noop} />
      </App>,
    );
    expect(list).toContain('匿名（谢琳）');
    expect(list).toContain('指派回复人 建议食堂增加低糖早餐选项');
  });

  it('renders post detail with stats, images, comments and admin reply', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumTopicDetailPage kind="forum" recordId="1" onBack={noop} />
      </App>,
    );
    expect(html).toContain('帖子详情');
    expect(html).toContain('查看链接');
    expect(html).toContain('人体工学椅');
    expect(html).toContain('周敏');
    expect(html).not.toContain('匿名（王涛）');
    expect(html).toContain('发帖人部门');
    expect(html).toContain('社区运营');
    expect(html).toContain('市场品牌部');
    expect(html).toContain('平台运营部');
    expect(html).toContain('2026-08-12 14:26');
    expect(html).toContain('二手论坛');
    expect(html).toContain('闲置转让');
    expect(html).toContain('点赞数');
    expect(html).toContain('收藏数');
    expect(html).toContain('评论数');
    expect(html).toContain('浏览数');
    expect(html).toContain('工作日晚上七点后');
    expect(html).toContain('回复 周敏');
    expect(html).toContain('回复帖子');
    expect(html).toContain('回复评论 周敏');
    expect(html).toContain('置顶评论 周敏');
    expect(html).toContain('置顶评论 唐宇');
    expect(html).not.toContain('置顶评论 王涛');
    expect(html).toContain('alt="九成新人体工学椅转让，可自提 图片"');
    expect(html).not.toContain('role="tab"');
    expect(html).toContain('加载更多');
    expect(html).toContain('补充主评论 10');
    expect(html).not.toContain('第十一条主评论');
    expect(html).toMatch(/评论/);
    expect(html).not.toContain('操作记录');
  });

  it('hides operation history even when pin records exist', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumTopicDetailPage kind="forum" recordId="5" onBack={noop} />
      </App>,
    );
    expect(html).toContain('建议食堂增加低糖早餐选项');
    expect(html).not.toContain('操作记录');
    expect(html).not.toContain('在论坛首页顶部展示');
  });

  it('renders advice detail basic info aligned with post detail', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumTopicDetailPage kind="mailbox" recordId="3" onBack={noop} />
      </App>,
    );
    expect(html).toContain('建言详情');
    expect(html).toContain('标题');
    expect(html).toContain('发起人');
    expect(html).toContain('匿名（彭越）');
    expect(html).not.toContain('匿名用户');
    expect(html).toContain('供应链中心');
    expect(html).not.toContain('处理人部门');
    expect(html).not.toContain('>处理人<');
    expect(html).toContain('周明远');
    expect(html).toContain('时间');
    expect(html).toContain('所属信箱');
    expect(html).toContain('经营发展');
    expect(html).not.toContain('所属板块');
    expect(html).not.toContain('建言献策');
    expect(html).not.toContain('帖子标签');
    expect(html).not.toContain('点赞数');
    expect(html).not.toContain('评论数');
    expect(html).not.toContain('浏览数');
    expect(html).not.toContain('审核记录');
    expect(html).not.toContain('公开私密');
    expect(html).not.toContain('可见范围');
    expect(html).not.toContain('评价数');
    expect(html).not.toContain('提交时间');
    expect(html).not.toContain('所属论坛');
    expect(html).not.toContain('下架');
    expect(html).toContain('处理人回复');
    expect(html).toContain('已收到您的留言');
    expect(html).toContain('将同步进展');
    expect(html).toContain('aria-label="回复内容"');
  });

  it('shows advice reply form when chairman has not replied and hides shelf actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumTopicDetailPage kind="mailbox" recordId="18" onBack={noop} />
      </App>,
    );
    expect(html).toContain('希望明确内部岗位竞聘信息发布规则');
    expect(html).toContain('回复账号');
    expect(html).toContain('aria-label="回复内容"');
    expect(html).not.toContain('下架');
    expect(html).not.toContain('处理人回复');
  });

  it('lists mailbox advice on board detail', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardDetailPage kind="mailbox" recordId="4" onBack={noop} onEdit={noop} onNavigate={noop} />
      </App>,
    );
    expect(html).not.toContain('建言管理');
    expect(html).toContain('跨部门项目职责边界');
    expect(html).toContain('匿名（彭越）');
    expect(html).not.toContain('search-field-label');
    expect(html).not.toContain('所属板块');
    expect(html).not.toContain('建言献策');
    expect(html).toContain('信箱');
    expect(html).toContain('经营发展');
    expect(html).toContain('周明远');
    expect(html).toContain('实际回复人');
    expect(html).not.toContain('处理人');
    expect(html).not.toContain('李明远');
    expect(html).not.toContain('员工体验');
    expect(html).not.toContain('处理人部门');
    expect(html).not.toContain('发起人部门');
    expect(html).not.toContain('人体工学椅');
    expect(html).not.toContain('点赞数');
    expect(html).not.toContain('评论数');
    expect(html).not.toContain('浏览数');
    expect(html).not.toContain('帖子标签');
    expect(html).not.toContain('审核记录');
    expect(html).not.toContain('下架');
  });

  it('renders forum create form fields', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardFormPage kind="forum" mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建论坛');
    expect(html).toContain('论坛名称');
    expect(html).not.toContain('论坛规则');
    expect(html).not.toContain('请输入发帖与互动规则');
    expect(html).toContain('允许匿名');
    expect(html).toContain('管理员');
    expect(html).toContain('开启后，用户可匿名发帖');
    expect(html).toContain('全员');
    expect(html).toContain('按部门');
    expect(html).toContain('自定义人群');
    expect(html).toContain('导入人群');
    expect(html).toContain('请按组织架构选择人员');
    expect(html).not.toContain('请选择组织');
    expect(html).toContain('背景图');
    expect(html).toContain('支持 bmp/png/jpeg/jpg/gif，建议比例16:9，不超过 5MB');
    expect(html).toContain('上传背景图');
    expect(html).toContain('论坛图标');
    expect(html).toContain('支持 bmp/png/jpeg/jpg/gif，建议比例1:1，不超过 5MB');
    expect(html).toContain('上传图标');
    expect(html).toContain('帖子标签');
    expect(html).toContain('请选择帖子标签');
    expect(html).not.toContain('回复人');
    expect(html).not.toContain('所属板块');
    expect(html).not.toContain('按组织架构勾选部门或人员，可多选。');
    expect(html).not.toContain('按组织架构选择到人，可多选。');
  });

  it('renders mailbox create form with icon upload only', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumBoardFormPage kind="mailbox" mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建信箱');
    expect(html).toContain('信箱图片');
    expect(html).toContain('支持 bmp/png/jpeg/jpg/gif，建议比例3:4，不超过 5MB');
    expect(html).toContain('上传图片');
    expect(html).not.toContain('信箱图标');
    expect(html).not.toContain('建议比例1:1');
    expect(html).not.toContain('背景图');
    expect(html).not.toContain('论坛图标');
    expect(html).toContain('响应时效');
    expect(html).toContain('开启后，时效到期前 1 小时会触发消息提醒。');
    expect(html).not.toContain('默认关闭');
    expect(html).not.toContain('开启后选择处理时效');
    expect(html).not.toContain('例如 24小时');
    expect(html).toContain('负责人');
    expect(html).toContain('已负责其他信箱');
    expect(html).toContain('表示已占用，不可再选');
    expect(html).not.toContain('信箱负责人');
    expect(html).toContain('信箱简介');
    expect(html).not.toContain('宗旨');
    expect(html).toContain('标签');
    expect(html).not.toContain('信箱标签');
    expect(html).toContain('请输入标签');
    expect(html).not.toContain('选项来自标签管理');
    expect(html).not.toContain('请选择标签');
    expect(html).not.toContain('信箱名称');
    expect(html).toContain('请输入名称');
    expect(html).not.toContain('所属板块');
    expect(html).not.toContain('请选择所属板块');
    expect(html).toContain('回复人');
    expect(html).toContain('请选择回复人');
    expect(html).not.toContain('按组织架构选择到人，可多选，非必填。');
    expect(html).not.toContain('按组织架构勾选部门或人员，可多选。');
    expect(html).not.toContain('按组织架构选择到人，仅选一人。');
    expect(html).not.toContain('请选择回复人必填');
    expect(html).not.toContain('规则说明');
    expect(html).not.toContain('处理人');
    expect(html).not.toContain('添加处理人');
  });

  it('lists mailbox tags separately from forum tags', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumTagListPage kind="mailbox" />
      </App>,
    );
    expect(html).toContain('标签管理');
    expect(html).toContain('信箱数');
    expect(html).toContain('员工体验');
    expect(html).not.toContain('闲置转让');
    expect(html).not.toContain('帖子数');
  });

  it('renders mute risk list', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumRiskPage />
      </App>,
    );
    expect(html).toContain('禁言管理');
    expect(html).toContain('唐宇');
    expect(html).toContain('发布违规广告信息');
    expect(html).toContain('2026-08-18 09:30');
    expect(html).toContain('2026-08-08 10:00');
    expect(html).toContain('生效中');
    expect(html).toContain('已解除');
    expect(html).toContain('添加禁言');
  });

  it('lists post tags with search, usage and inline actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <ForumTagListPage />
      </App>,
    );
    expect(html).toContain('标签管理');
    expect(html).toContain('闲置转让');
    expect(html).toContain('新建标签');
    expect(html).not.toContain('排序');
    expect(html).toContain('帖子数');
    expect(html).toContain('上移');
    expect(html).toContain('下移');
    expect(html).toContain('编辑');
    expect(html).toContain('禁用');
    expect(html).toContain('删除');
    expect(html).not.toContain('更多操作');
    expect(html.match(/共 \d+ 条/g)?.length).toBe(2);
  });
});
