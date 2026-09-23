import { afterEach, describe, expect, it } from 'vitest';
import { deleteCourseNote, getCourseNote, listCourseNotes, updateCourseNote, __resetCourseNotesForTests } from './clientCourseNotes';

describe('course notes store', () => {
  afterEach(() => {
    __resetCourseNotesForTests();
  });

  it('shows title content time and linked course name newest first', () => {
    const notes = listCourseNotes();
    expect(notes.map((item) => item.title)).toEqual(['结构化表达三步', '跨部门对齐清单', '开场破冰话术']);
    expect(notes[0]).toMatchObject({
      content: expect.stringContaining('结论先行'),
      createdAt: '2026-09-12 21:18',
      courseName: '快速提升自己的沟通能力',
    });
    expect(notes[2].courseName).toBe('快速上手销售技巧');
    expect(getCourseNote(1)?.title).toBe('结构化表达三步');
    expect(getCourseNote(99)).toBeUndefined();
  });

  it('updates and deletes a note', () => {
    expect(updateCourseNote(1, { title: '  新标题  ', content: '新内容' })).toBe(true);
    expect(getCourseNote(1)).toMatchObject({ title: '新标题', content: '新内容' });
    expect(updateCourseNote(1, { title: '  ', content: 'x' })).toBe(false);
    expect(deleteCourseNote(1)).toBe(true);
    expect(getCourseNote(1)).toBeUndefined();
    expect(listCourseNotes().map((item) => item.id)).toEqual([2, 3]);
  });
});
