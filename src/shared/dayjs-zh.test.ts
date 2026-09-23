import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import './dayjs-zh';

describe('dayjs zh-CN locale', () => {
  it('uses Chinese weekdays and months', () => {
    expect(dayjs.locale()).toBe('zh-cn');
    expect(dayjs().localeData().weekdaysMin()).toEqual(['日', '一', '二', '三', '四', '五', '六']);
    expect(dayjs().localeData().monthsShort()[7]).toBe('8月');
  });
});
