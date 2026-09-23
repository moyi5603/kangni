import { afterEach, describe, expect, it } from 'vitest';
import { patchDecoBlock } from './activityDecoration';
import {
  getActivityDecoration,
  getPublishedActivityDecoration,
  publishActivityDecoration,
  resetActivityDecoration,
  saveActivityDecoration,
} from './activityDecorationStore';

afterEach(() => {
  resetActivityDecoration();
});

describe('activityDecorationStore', () => {
  it('publishes draft to C-end without applying unsaved draft', () => {
    const draft = patchDecoBlock(getActivityDecoration('mobile'), 'deco-activity', { listStyle: 'left-image' });
    saveActivityDecoration('mobile', draft);
    expect(getActivityDecoration('mobile').blocks[1].listStyle).toBe('left-image');
    expect(getPublishedActivityDecoration('mobile').blocks[1].listStyle).toBe('large-image');
    publishActivityDecoration('mobile');
    expect(getPublishedActivityDecoration('mobile').blocks[1].listStyle).toBe('left-image');
  });
});
