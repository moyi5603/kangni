import { describe, expect, it } from 'vitest';
import {
  addCourseCategoryNode,
  addCoursewareCategory,
  getCourseCategorySiblingIndex,
  getCourseCategoryUsage,
  getCoursewareCategorySiblingIndex,
  getCoursewareCategoryUsage,
  isCourseCategoryNameTaken,
  isCoursewareCategoryNameTaken,
  moveCourseCategory,
  moveCoursewareCategory,
  removeCourse,
  removeCourseware,
  renameCourseCategory,
  renameCoursewareCategory,
  setCourseCategory,
  setCourseStatus,
} from './trainingStore';
import { canDeleteCourse, initialCourses, initialCourseware, initialCoursewareCategories } from './training';

describe('addCoursewareCategory', () => {
  it('adds a root category', () => {
    const created = addCoursewareCategory('新分类甲');
    expect(created?.name).toBe('新分类甲');
    expect(isCoursewareCategoryNameTaken('新分类甲', null)).toBe(true);
  });

  it('adds a child under an existing parent', () => {
    const created = addCoursewareCategory('新子分类', 10);
    expect(created?.name).toBe('新子分类');
    expect(isCoursewareCategoryNameTaken('新子分类', 10)).toBe(true);
    expect(isCoursewareCategoryNameTaken('新子分类', null)).toBe(false);
  });

  it('treats sibling names as taken', () => {
    expect(isCoursewareCategoryNameTaken(initialCoursewareCategories[0].name, null)).toBe(true);
    expect(isCoursewareCategoryNameTaken('不存在的分类名', null)).toBe(false);
  });
});

describe('courseware category actions', () => {
  it('renames a category', () => {
    const targetId = initialCoursewareCategories[0].id;
    expect(renameCoursewareCategory(targetId, '重命名分类')).toBe(true);
    expect(isCoursewareCategoryNameTaken('重命名分类', null)).toBe(true);
  });

  it('moves a category within siblings', () => {
    const firstId = initialCoursewareCategories[0].id;
    const secondId = initialCoursewareCategories[1].id;
    expect(getCoursewareCategorySiblingIndex(firstId)?.index).toBe(0);
    expect(moveCoursewareCategory(firstId, 'down')).toBe(true);
    expect(getCoursewareCategorySiblingIndex(firstId)?.index).toBe(1);
    expect(getCoursewareCategorySiblingIndex(secondId)?.index).toBe(0);
  });

  it('detects category usage by courseware', () => {
    expect(getCoursewareCategoryUsage(21).canDelete).toBe(false);
    expect(getCoursewareCategoryUsage(21).coursewareCount).toBeGreaterThan(0);
  });
});

describe('course category actions', () => {
  it('rejects a fourth-level category', () => {
    expect(addCourseCategoryNode('四级', 211)).toBeNull();
    expect(addCoursewareCategory('四级', 211)).toBeNull();
  });

  it('adds a child under an existing parent', () => {
    const created = addCourseCategoryNode('新岗位子类', 10);
    expect(created?.name).toBe('新岗位子类');
    expect(isCourseCategoryNameTaken('新岗位子类', 10)).toBe(true);
    expect(isCourseCategoryNameTaken('新岗位子类', null)).toBe(false);
  });

  it('moves a category within siblings', () => {
    expect(getCourseCategorySiblingIndex(10)?.index).toBe(0);
    expect(moveCourseCategory(10, 'down')).toBe(true);
    expect(getCourseCategorySiblingIndex(10)?.index).toBe(1);
  });

  it('renames a category', () => {
    expect(renameCourseCategory(30, '办公技能体系')).toBe(true);
    expect(isCourseCategoryNameTaken('办公技能体系', null)).toBe(true);
  });

  it('blocks delete when courses still use the subtree', () => {
    expect(getCourseCategoryUsage(20).canDelete).toBe(false);
    expect(getCourseCategoryUsage(20).courseCount).toBeGreaterThan(0);
  });
});

describe('course publish and category', () => {
  it('publishes a draft so it can no longer be deleted', () => {
    const draft = initialCourses.find((item) => item.status === '草稿')!;
    expect(canDeleteCourse(draft)).toBe(true);
    setCourseStatus([draft.id], '已发布');
    expect(removeCourse(draft.id)).toBe(false);
  });

  it('only deletes unpublished courses', () => {
    const unpublished = initialCourses.find((item) => item.status === '已下架');
    const published = initialCourses.find((item) => item.status === '已发布');
    expect(unpublished).toBeTruthy();
    expect(published).toBeTruthy();
    expect(removeCourse(published!.id)).toBe(false);
    expect(removeCourse(unpublished!.id)).toBe(true);
  });

  it('sets category and counts usage on the new node', () => {
    const target = initialCourses.find((item) => item.categoryId === 10)!;
    const before = getCourseCategoryUsage(33).courseCount;
    setCourseCategory([target.id], 33);
    expect(getCourseCategoryUsage(33).courseCount).toBe(before + 1);
  });
});

describe('removeCourseware', () => {
  it('only deletes draft courseware', () => {
    const draft = initialCourseware.find((item) => item.publishStatus === '草稿');
    const published = initialCourseware.find((item) => item.publishStatus === '已发布');
    expect(draft).toBeTruthy();
    expect(published).toBeTruthy();
    expect(removeCourseware(published!.id)).toBe(false);
    expect(removeCourseware(draft!.id)).toBe(true);
  });
});
