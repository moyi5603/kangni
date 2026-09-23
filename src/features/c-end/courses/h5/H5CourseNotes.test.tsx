import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetCourseNotesForTests } from '../model/clientCourseNotes';
import { H5CourseNotes } from './H5CourseNotes';

describe('H5 course notes', () => {
  afterEach(() => {
    __resetCourseNotesForTests();
  });
  it('lists notes with title content time and course name', () => {
    const html = renderToStaticMarkup(<H5CourseNotes />);
    expect(html).toContain('class="c-h5-shell is-contest is-notes"');
    expect(html).toContain('笔记');
    expect(html).toContain('aria-label="笔记列表"');
    expect(html).toContain('结构化表达三步');
    expect(html).toContain('结论先行');
    expect(html).toContain('09-12 21:18');
    expect(html).toContain('快速提升自己的沟通能力');
    expect(html).toContain('开场破冰话术');
    expect(html).toContain('快速上手销售技巧');
    expect(html).toContain('href="#/c/h5/skills-contest/notes/1"');
    expect(html).toContain('href="#/c/h5/skills-contest/notes/3"');
    expect(html).not.toContain('href="#/c/h5/course-2"');
  });

  it('opens a note detail from CEndApp', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="course-note-detail" noteId={1} />);
    expect(html).toContain('笔记详情');
    expect(html).toContain('结构化表达三步');
    expect(html).toContain('结论先行');
    expect(html).toContain('快速提升自己的沟通能力');
    expect(html).toContain('href="#/c/h5/course-1"');
    expect(html).toContain('编辑');
    expect(html).toContain('删除');
  });

  it('mounts from CEndApp', () => {
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="course-notes" />)).toContain('结构化表达三步');
  });
});
