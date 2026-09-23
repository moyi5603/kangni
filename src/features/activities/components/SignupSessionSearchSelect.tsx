import { Select } from 'antd';
import { sessionSelectOptions } from '../model/sessionSignupOverview';

type SessionOption = { id: string; startAt: string; endAt: string };

export function SignupSessionSearchSelect({
  sessions,
  value,
  onChange,
}: {
  sessions: readonly SessionOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      showSearch
      optionFilterProp="label"
      placeholder="全部场次"
      value={value}
      onChange={(next) => onChange(next ?? '')}
      options={sessionSelectOptions(sessions)}
      popupMatchSelectWidth={false}
      popupClassName="signup-session-search-popup"
      className="signup-session-search-select"
      optionRender={(option) => {
        const data = option.data as { indexLabel?: string; timeLabel?: string };
        if (!data.timeLabel) return option.label;
        return (
          <span className="signup-session-option">
            <span>{data.indexLabel ?? option.label}</span>
            <span className="signup-session-option-time">{data.timeLabel}</span>
          </span>
        );
      }}
    />
  );
}
