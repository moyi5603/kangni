import { App, Form } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AwardDetailPage } from './AwardDetailPage';
import { AwardResultEntryContent, AwardResultNominationPicker } from '../components/AwardResultEntry';
import { getAwardNominations } from '../model/awardNominationStore';
import { getAward } from '../model/awardStore';

function render(recordId = '2', tab?: string) {
  return renderToStaticMarkup(
    <App>
      <AwardDetailPage recordId={recordId} tab={tab} onBack={() => undefined} onEdit={() => undefined} />
    </App>,
  );
}

describe('AwardDetailPage', () => {
  it('aligns detail groups with the create form', () => {
    const html = render();
    expect(html).toContain('基础信息');
    expect(html).toContain('评优活动名称');
    expect(html).toContain('评优类型');
    expect(html).toContain('活动简介');
    expect(html).toContain('评优标准');
    expect(html).toContain('名次奖励');
    expect(html).toContain('获奖名次数');
    expect(html).not.toContain('前 x 名');
    expect(html).toContain('可见范围');
    expect(html).toContain('提名人');
    expect(html).toContain('提名范围');
    expect(html).toContain('结束后自动公示');
    expect(html).toContain('高级设置');
    expect(html).toContain('评论区');
    expect(html).toContain('投票排序规则');
    expect(html).toContain('Q3 团队协同奖');
    expect(html).not.toContain('提名名单与审核后续补充');
  });

  it('exposes nomination, result and comment tabs', () => {
    const html = render();
    expect(html).toContain('提名');
    expect(html).toContain('评优结果');
    expect(html).toContain('评论');
  });

  it('shows nomination fields on the nomination tab', () => {
    const html = render('2', 'nominations');
    expect(html).toContain('提名标题');
    expect(html).toContain('提名人');
    expect(html).toContain('提名名单');
    expect(html).toContain('推荐理由');
    expect(html).toContain('核心亮点');
    expect(html).toContain('研发协同突击队');
    expect(html).toContain('展开');
    expect(html).toContain('请输入提名标题');
    expect(html).toContain('请输入提名人');
    expect(html).toContain('王芳');
    expect(html).toContain('后端组');
    expect(html).toContain('查看名单');
    expect(html).toContain('等20人');
    expect(html).toContain('导出');
    expect(html).not.toContain('13800001003');
  });

  it('shows auto winners on the results tab of a published ended award', () => {
    const html = render('4', 'results');
    expect(html).toContain('获奖名次');
    expect(html).toContain('张悦年度贡献');
    expect(html).toContain('查看名单');
    expect(html).toContain('等20人');
    expect(html).toContain('发放奖励');
  });

  it('lets unpublished ended awards enter results in a modal', () => {
    const html = render('5', 'results');
    expect(html).toContain('录入结果');
    expect(html).toContain('发放奖励');
    expect(html).toContain('结果公示');
    expect(html).toContain('尚未录入评优结果');
    expect(html).toContain('录入评优结果');
  });

  it('hides result publicity action before award ends', () => {
    expect(render('2')).not.toMatch(/>结果公示</);
  });

  it('lets published ended awards cancel publicity from the header', () => {
    expect(render('4')).toContain('取消公示');
  });

  it('shows rank slots inside the result entry modal', () => {
    const award = getAward(5);
    expect(award).toBeDefined();
    function Harness() {
      const [form] = Form.useForm();
      return (
        <AwardResultEntryContent
          award={award!}
          passed={[]}
          form={form}
          rowsWatch={[]}
          onPickRank={() => undefined}
          onClearRank={() => undefined}
          onViewPeople={() => undefined}
        />
      );
    }
    const html = renderToStaticMarkup(
      <App>
        <Harness />
      </App>,
    );
    expect(html).toContain('每个名次单独选择提名');
    expect(html).toContain('选择提名');
    expect(html).toContain('未选择');
    expect(html).not.toContain('选入当前名次');
  });

  it('shows nominee lists in the nested nomination picker', () => {
    const award = getAward(5);
    expect(award).toBeDefined();
    const passed = getAwardNominations(5).filter((item) => item.reviewStatus === '已通过');
    const html = renderToStaticMarkup(
      <App>
        <AwardResultNominationPicker
          rankTitle={award!.ranks[0].title}
          passed={passed}
          usedIds={new Set()}
          currentNominationId={undefined}
          onPick={() => undefined}
          onViewPeople={() => undefined}
        />
      </App>,
    );
    expect(html).toContain('创新孵化项目');
    expect(html).toContain('李明、陈产品');
    expect(html).toContain('等20人');
    expect(html).toContain('查看名单');
    expect(html).toContain('选用');
    expect(html).toContain('请输入提名标题');
    expect(html).toContain('请输入被提名人');
    expect(html).toContain('请输入提名人');
    expect(html).toContain('search-fields--2');
    expect(html.indexOf('低代码工单试点')).toBeLessThan(html.indexOf('创新孵化项目'));
  });

  it('shows comments instead of a placeholder', () => {
    const html = render('2', 'comments');
    expect(html).toContain('评论内容');
    expect(html).toContain('评论人');
    expect(html).not.toContain('评论功能后续补充');
  });
});
