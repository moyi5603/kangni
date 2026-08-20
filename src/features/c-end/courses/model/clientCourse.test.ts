import { describe, expect, it } from 'vitest';
import { getCourseCategoryTree } from '../../../training/model/trainingStore';
import {
  filterClientCourses,
  getClientCourse,
  getCourseLearning,
  l2Tabs,
  l3Options,
  listPublishedClientCourses,
  maxCategoryDepth,
  pathAfterSelectingL1,
  resolveFilterId,
} from './clientCourse';

const tree = getCourseCategoryTree();
const tech = tree.find((node) => node.name === '科技分类0001')!;
const acceptance = tree.find((node) => node.name === '【一级】验收测试分类')!;
const python = acceptance.children!.find((node) => node.name === '【二级】python')!;
const entry = python.children!.find((node) => node.name === '入门')!;
const office = tree.find((node) => node.name === '办公技能')!;
const ppt = office.children!.find((node) => node.name === 'PPT 高级教程')!;

function titles(categoryId: number | null, keyword = '') {
  return filterClientCourses(listPublishedClientCourses(), tree, { keyword, categoryId }).map(
    (item) => item.title,
  );
}

describe('client course catalog', () => {
  it('caps the admin tree at three levels', () => {
    expect(maxCategoryDepth(tree)).toBe(3);
  });

  it('maps published courses from trainingStore', () => {
    expect(tree.map((node) => node.name)).toEqual(['科技分类0001', '【一级】验收测试分类', '办公技能']);
    expect(listPublishedClientCourses().map((item) => item.title)).toContain('快速提升自己的沟通能力');
    expect(getClientCourse(5)).toBeUndefined();
    expect(getClientCourse(6)).toBeUndefined();
  });

  it('includes courses hung on the node and its descendants', () => {
    expect(titles(tech.id)).toEqual(['快速上手销售技巧', '产品需求分析实战']);
    expect(titles(acceptance.id)).toContain('快速提升自己的沟通能力');
    expect(titles(python.id)).toEqual([]);
    expect(titles(entry.id)).toEqual([]);
    expect(titles(null)).toContain('车间安全操作规范');
    expect(titles(office.id)).toEqual(['新员工入职指引', '车间安全操作规范', '初级会计培训']);
    expect(titles(ppt.id)).toEqual(['车间安全操作规范']);
  });

  it('keeps L2 tabs on the same row and puts L3 in a sheet option list', () => {
    expect(l2Tabs(tree, null)).toEqual([]);
    expect(l2Tabs(tree, tech.id)).toEqual([]);
    expect(l2Tabs(tree, acceptance.id).map((tab) => tab.name)).toEqual([
      '全部',
      '【二级】python',
      '【二级】Java',
      '【二级】PHP',
    ]);
    expect(l3Options(tree, 'all')).toEqual([]);
    expect(l3Options(tree, python.id).map((tab) => tab.name)).toEqual(['全部', '精通', '入门']);
    expect(resolveFilterId({ l1Id: acceptance.id, l2Id: python.id, l3Id: 'all' })).toBe(python.id);
    expect(resolveFilterId({ l1Id: acceptance.id, l2Id: python.id, l3Id: entry.id })).toBe(entry.id);
  });

  it('resets L2 and L3 to 全部 when switching L1', () => {
    expect(pathAfterSelectingL1(acceptance.id)).toEqual({ l1Id: acceptance.id, l2Id: 'all', l3Id: 'all' });
    expect(pathAfterSelectingL1(null)).toEqual({ l1Id: null, l2Id: 'all', l3Id: 'all' });
  });

  it('exposes learning catalog and comments for the communication course', () => {
    const learning = getCourseLearning(1);
    expect(learning?.lessons.map((item) => item.title)).toEqual([
      '1.课件20260708',
      '2.PPT高级排版技巧',
      '3.PPT动画特效制作',
    ]);
    expect(learning?.comments).toHaveLength(2);
    expect(learning?.comments[0]).toMatchObject({
      author: '陈产品',
      text: '这条被驳回了，只有我能看见。',
      statusLabel: '已驳回',
    });
    expect(learning?.comments[1]).toMatchObject({ author: '钟。', text: '你好', time: '08-10 18:11', statusLabel: null });
    expect(learning?.intro[0]).toContain('沟通方式不对');
  });
});
