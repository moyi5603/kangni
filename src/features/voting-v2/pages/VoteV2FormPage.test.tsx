import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultVoteV2Campaign } from '../model/voteV2';
import { __resetVoteV2StoreForTests, upsertVoteV2, upsertVoteV2Contestant } from '../model/voteV2Store';
import { VoteV2FormPage } from './VoteV2FormPage';

beforeEach(() => {
  __resetVoteV2StoreForTests();
});

describe('VoteV2FormPage', () => {
  it('shows grouped create fields aligned to 评选活动', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="create" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('新建活动');
    expect(html).not.toContain('1:1 对齐人人微投票');
    expect(html).not.toContain('微信能力为原型模拟');
    expect(html).not.toContain('扫码预览');
    expect(html).toContain('vote-v2-form-actions');
    expect(html).toContain('data-device="390x844"');
    expect(html).toContain('基本设置');
    expect(html).toContain('样式设置');
    expect(html).toContain('功能设置');
    expect(html).toContain('参与范围');
    expect(html).toContain('全员');
    expect(html).toContain('按部门');
    expect(html.indexOf('投票分组')).toBeLessThan(html.indexOf('参与范围'));
    expect(html.indexOf('参与范围')).toBeLessThan(html.indexOf('投票规则设置'));
    expect(html).not.toContain('自定义人员');
    expect(html).not.toContain('导入人群');
    expect(html).not.toContain('高级功能');
    expect(html).not.toContain('高级设置');
    expect(html).toContain('活动名称');
    expect(html).toContain('0 / 50');
    expect(html).toContain('活动介绍');
    expect(html).toContain('rich-text');
    expect(html).toContain('aria-label="活动介绍"');
    expect(html).toContain('vote-v2-intro-field');
    expect(html).not.toContain('活动介绍参考模板');
    expect(html).not.toContain('vote-v2-intro-templates');
    expect(html).not.toContain('套用模板');
    expect(html).not.toContain('为庆祝XXXX节');
    expect(html).toContain('选手数');
    expect(html).toContain('活动倒计时');
    expect(html).toContain('投票介绍：');
    expect(html).toContain('背景色');
    expect(html).toContain('区块背景');
    expect(html).toContain('插入图片');
    expect(html).not.toContain('支持从第三方编辑器复制文本样式');
    expect(html).not.toContain('无需修改可直接发布');
    expect(html).not.toContain('支持纯文本');
    expect(html).toContain('每天');
    expect(html).toContain('总共');
    expect(html).not.toContain('多选/单选规则');
    expect(html).not.toContain('最少选择');
    expect(html).not.toContain('最多选择');
    expect(html).toContain('每人可投');
    expect(html).toContain('可为同一选项投');
    expect(html).toContain('vote-v2-rule-quota-row');
    expect(html).toContain('规则提示');
    expect(html).toContain('每人每天可投1票');
    expect(html).not.toContain('每人票数');
    expect(html).not.toContain('自主报名');
    expect(html).not.toContain('报名设置');
    expect(html).not.toContain('防刷票设置');
    expect(html).not.toContain('微信黑名单防刷');
    expect(html).toContain('cover-upload-trigger');
    expect(html).toContain('主题颜色');
    expect(html).toContain('背景图');
    expect(html).not.toContain('上传背景图');
    expect(html).toContain('vote-v2-theme-swatch');
    expect(html).toContain('蓝色');
    expect(html).toContain('青色');
    expect(html).toContain('红色');
    expect(html).toContain('橙色');
    expect(html).toContain('黄色');
    expect(html).toContain('绿色');
    expect(html).toContain('紫色');
    expect(html).toContain('粉色');
    expect(html).not.toContain('渐变1');
    expect(html).not.toContain('渐变2');
    expect(html).not.toContain('渐变3');
    expect(html).toContain('自定义');
    expect(html).toContain('选项称谓');
    expect(html).toContain('作品');
    expect(html).toContain('投票页选项的称谓，例如选手、作品等，投票页上会对应显示');
    expect(html).not.toContain('选手称谓');
    expect(html).toContain('加油');
    expect(html).toContain('单位设置');
    expect(html).toContain('一列');
    expect(html).toContain('二列');
    expect(html).toContain('三列');
    expect(html).toContain('四列');
    expect(html).toContain('五列');
    expect(html).toContain('移动端列数');
    expect(html).toContain('PC端列数');
    expect(html).not.toContain('4列');
    expect(html).not.toContain('分组列数');
    expect(html).toContain('示例1');
    expect(html).toContain('示例8');
    expect(html).toContain('data-cols="2"');
    expect(html).toContain('请输入选手名称、编号');
    expect(html).toContain('vote-v2-phone-search-btn');
    expect(html).toContain('页面设置');
    expect(html).toContain('活动数据');
    expect(html).toContain('选项搜索');
    expect(html).toContain('选项分组');
    expect(html).toContain('选项编号');
    expect(html).toContain('选项封面');
    expect(html).toContain('选项名称');
    expect(html).toContain('选项副标题');
    expect(html).toContain('选项票数');
    expect(html).not.toContain('选手搜索');
    expect(html).toContain('详情按钮');
    expect(html).not.toContain('选手详情页');
    expect(html).not.toContain('自定义颜色');
    expect(html).not.toContain('漂浮物');
    expect(html).not.toContain('背景音乐');
    expect(html).not.toContain('无背景音乐');
    expect(html).not.toContain('封面地址');
    expect(html).not.toContain('图片封面');
    expect(html).not.toContain('自定义1导航');
    expect(html).not.toContain('自定义2导航');
    expect(html).not.toContain('自定义1链接');
    expect(html).toContain('下一步');
    expect(html).toContain('保存发布后可添加选项');
    expect(html).not.toContain('问答题');
    expect(html).not.toContain('本页先占位');
    expect(html).not.toContain('微信分享活动');
    expect(html).not.toContain('内部投票');
    expect(html).not.toContain('关注后投票');
    expect(html).toMatch(/title="上传封面"[^>]*ant-form-item-required|ant-form-item-required[^>]*title="上传封面"/);
  });

  it('locks name and time when editing a running campaign', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="edit" recordId="2" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('编辑活动');
    expect(html).toContain('车间安全之星');
    expect(html).toContain('张工');
    expect(html).toContain('李班');
    expect(html).not.toContain('示例1');
    expect(html).not.toContain('多选/单选规则');
    expect(html).not.toContain('最少选择');
    expect(html).not.toContain('最多选择');
    expect(html).toContain('可为同一选项投');
    expect(html).toContain('vote-v2-rule-quota-row');
    expect(html).toMatch(/title="每人可投"/);
    expect(html).toContain('每人可投3票');
    expect(html).toContain('保存发布后可添加选项');
    expect(html).not.toContain('去选项管理');
    expect(html).not.toContain('添加选手');
    expect(html).not.toContain('去选手管理');
    expect(html).toContain('ant-input-disabled');
    expect(html).toContain('ant-picker-disabled');
  });

  it('shows background upload placeholder only after enabled', () => {
    upsertVoteV2(
      defaultVoteV2Campaign({
        id: 9,
        name: '背景图开启',
        startAt: '2026-09-01 09:00:00',
        endAt: '2026-09-10 18:00:00',
        createdAt: '2026-08-27 10:00:00',
        backgroundEnabled: true,
      }),
    );
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="edit" recordId="9" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('上传背景图');
  });

  it('lets groups move and shows option counts', () => {
    upsertVoteV2Contestant({
      id: 21,
      campaignId: 1,
      groupId: 1,
      name: '甲',
      imageUrl: '',
      videoUrl: '',
      audioUrl: '',
      description: '',
      phone: '',
      voteCount: 0,
    });
    upsertVoteV2Contestant({
      id: 22,
      campaignId: 1,
      groupId: 1,
      name: '乙',
      imageUrl: '',
      videoUrl: '',
      audioUrl: '',
      description: '',
      phone: '',
      voteCount: 0,
    });
    upsertVoteV2Contestant({
      id: 23,
      campaignId: 1,
      groupId: 2,
      name: '丙',
      imageUrl: '',
      videoUrl: '',
      audioUrl: '',
      description: '',
      phone: '',
      voteCount: 0,
    });
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="edit" recordId="1" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('生产组');
    expect(html).toContain('职能组');
    expect(html).toContain('上移');
    expect(html).toContain('下移');
    expect(html).toContain('aria-label="上移分组 生产组"');
    expect(html).toContain('aria-label="下移分组 职能组"');
    expect(html).toContain('5 个选项');
    expect(html).toContain('3 个选项');
    expect(html).toContain('vote-v2-group-name');
    expect(html).toMatch(/\d+ \/ 20/);
    expect(html).not.toContain('分组列数');
    expect(html).toContain('显示全部分组');
  });

  it('shows department picker when campaign is scoped by department', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="edit" recordId="5" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('选择部门');
    expect(html).toContain('生产中心');
  });

  it('opens a read-only detail view', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="view" recordId="1" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('活动详情');
    expect(html).toContain('部门十佳员工评选');
    expect(html).toContain('返回');
    expect(html).toContain('去编辑');
    expect(html).toContain('详情');
    expect(html).toContain('创建人');
    expect(html).toContain('陈产品');
    expect(html).toContain('投票结果');
    expect(html).toContain('投票记录');
    expect(html).not.toContain('保存并发布');
    expect(html).not.toContain('下一步');
  });

  it('does not show result tabs on create or edit', () => {
    const createHtml = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="create" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(createHtml).not.toContain('投票结果');
    expect(createHtml).not.toContain('投票记录');
  });

  it('shows ranks on the results tab', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="view" recordId="2" tab="results" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('名次');
    expect(html).toContain('票数');
    expect(html).toContain('占比');
    expect(html).toContain('张工');
    expect(html).toContain('128');
    expect(html).not.toContain('vote-v2-create');
  });

  it('shows voter and option on the records tab', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="view" recordId="3" tab="records" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('姓名');
    expect(html).toContain('部门');
    expect(html).toContain('导出');
    expect(html).toContain('张悦');
    expect(html).toContain('前端组');
    expect(html).toContain('夜跑纪实');
    expect(html).not.toContain('vote-v2-create');
  });

  it('shows grouped multi-select content on the records tab', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="view" recordId="2" tab="records" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('李明');
    expect(html).toContain('张工、李班、王姐');
    expect(html).toContain('导出');
  });

  it('uses empty copy before any votes on results', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2FormPage mode="view" recordId="6" tab="results" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('尚未开始，暂无投票');
  });
});
