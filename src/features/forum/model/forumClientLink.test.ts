import { describe, expect, it } from 'vitest';
import { forumBoardClientUrl, forumTopicClientUrl } from './forumClientLink';

describe('forumClientLink', () => {
  it('builds C-end H5 board and topic urls', () => {
    expect(forumBoardClientUrl(1, 'https://corp.example', '/')).toBe('https://corp.example/#/c/h5/forum/1');
    expect(forumBoardClientUrl(2, 'https://corp.example', '/admin/')).toBe('https://corp.example/admin/#/c/h5/forum/2');
    expect(forumTopicClientUrl(4, 'https://corp.example', '/')).toBe('https://corp.example/#/c/h5/forum-topic/4');
  });
});
