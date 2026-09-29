import { afterEach, describe, expect, it } from 'vitest';
import {
  createCourseNote,
  deleteCourseNote,
  getCourseNote,
  listCourseNotes,
  listCourseNotesByCourse,
  notePlainText,
  sanitizeNoteHtml,
  updateCourseNote,
  __resetCourseNotesForTests,
} from './clientCourseNotes';

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

  it('creates multiple notes for one course and keeps rich text images', () => {
    const image = '<p>要点</p><img src="data:image/png;base64,aaa">';
    const created = createCourseNote({ courseId: 2, title: '  客户开场  ', content: image });
    expect(created?.title).toBe('客户开场');
    expect(created?.courseId).toBe(2);
    expect(created?.content).toContain('<img src="data:image/png;base64,aaa"');
    expect(listCourseNotesByCourse(2).map((item) => item.title)).toEqual(['客户开场', '开场破冰话术']);
    expect(listCourseNotesByCourse(1).map((item) => item.title)).toEqual(['结构化表达三步', '跨部门对齐清单']);
    expect(createCourseNote({ courseId: 2, title: '只有图', content: '<img src="data:image/png;base64,bbb">' })?.title).toBe('只有图');
    expect(createCourseNote({ courseId: 2, title: '空内容', content: '<p><br></p>' })).toBeNull();
    expect(createCourseNote({ courseId: 2, title: '  ', content: '<p>有内容</p>' })).toBeNull();
    expect(createCourseNote({ courseId: 99, title: '不存在', content: '<p>有内容</p>' })).toBeNull();
  });

  it('strips unsafe html and keeps readable text', () => {
    expect(sanitizeNoteHtml('<script>alert(1)</script><b>加粗</b><img src="javascript:alert(1)">')).toBe('<b>加粗</b>');
    expect(
      sanitizeNoteHtml('<h3>小节</h3><ul><li><i>斜</i><u>下</u><s>划</s></li></ul><ol><li>1</li></ol><blockquote>引用</blockquote>'),
    ).toBe('<h3>小节</h3><ul><li><i>斜</i><u>下</u><s>划</s></li></ul><ol><li>1</li></ol><blockquote>引用</blockquote>');
    expect(notePlainText('<p>结论先行</p><img src="data:image/png;base64,aaa">')).toBe('结论先行');
    expect(updateCourseNote(1, { title: '图注', content: '<p><br></p>' })).toBe(false);
  });
});
