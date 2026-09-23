import { useState } from 'react';
import { DatePicker, Segmented } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import '../../../shared/dayjs-zh';

export type OverviewDateGranularity = 'day' | 'month';
export type OverviewDateValue = [Dayjs, Dayjs];

export function defaultOverviewDateRange(now = dayjs()): OverviewDateValue {
  return [now.subtract(29, 'day').startOf('day'), now.endOf('day')];
}

function toMonthRange(range: OverviewDateValue): OverviewDateValue {
  return [range[0].startOf('month'), range[1].endOf('month')];
}

function toDayRange(range: OverviewDateValue): OverviewDateValue {
  return [range[0].startOf('month'), range[1].endOf('month')];
}

export function OverviewDateRange({
  value,
  onChange,
}: {
  value: OverviewDateValue;
  onChange: (next: OverviewDateValue) => void;
}) {
  const [granularity, setGranularity] = useState<OverviewDateGranularity>('day');
  const dayPresets = [
    { label: '近7天', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] as OverviewDateValue },
    { label: '近30天', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] as OverviewDateValue },
  ];

  return (
    <div className="overview-date-range" aria-label="概览日期范围">
      <Segmented
        value={granularity === 'day' ? '日' : '月'}
        options={['日', '月']}
        onChange={(next) => {
          const mode = next === '月' ? 'month' : 'day';
          setGranularity(mode);
          onChange(mode === 'month' ? toMonthRange(value) : toDayRange(value));
        }}
      />
      <DatePicker.RangePicker
        picker={granularity === 'month' ? 'month' : 'date'}
        value={value}
        allowClear={false}
        format={granularity === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'}
        separator="→"
        renderExtraFooter={
          granularity === 'day'
            ? () => (
                <div className="overview-date-presets">
                  {dayPresets.map((item) => (
                    <button key={item.label} type="button" onClick={() => onChange(item.value)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )
            : undefined
        }
        onChange={(next) => {
          if (!next?.[0] || !next[1]) return;
          onChange(
            granularity === 'month'
              ? [next[0].startOf('month'), next[1].endOf('month')]
              : [next[0].startOf('day'), next[1].endOf('day')],
          );
        }}
      />
    </div>
  );
}
