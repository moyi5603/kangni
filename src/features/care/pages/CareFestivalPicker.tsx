import { theme } from 'antd';

export type CareTileOption = { value: string; label: string; hint?: string; disabled?: boolean };
export type CareTileGroup = { label?: string; options: CareTileOption[] };

export function CareOptionTiles({
  value,
  onChange,
  groups,
  options,
  multiple = false,
}: {
  value?: string | string[];
  onChange?: (next: string | string[]) => void;
  groups?: CareTileGroup[];
  options?: CareTileOption[];
  multiple?: boolean;
}) {
  const { token } = theme.useToken();
  const sections = groups?.length ? groups : [{ options: options ?? [] }];
  const selected = multiple ? (Array.isArray(value) ? value : []) : value;

  const pick = (item: CareTileOption) => {
    if (item.disabled) return;
    if (!multiple) {
      onChange?.(item.value);
      return;
    }
    const current = Array.isArray(selected) ? selected : [];
    onChange?.(current.includes(item.value) ? current.filter((entry) => entry !== item.value) : [...current, item.value]);
  };

  return (
    <div className="care-option-tiles">
      {sections.map((group, index) => (
        <div key={group.label ?? String(index)}>
          {group.label ? (
            <div className="care-option-tiles__title" style={{ color: token.colorTextSecondary }}>
              {group.label}
            </div>
          ) : null}
          <div className="care-option-tiles__grid">
            {group.options.map((item) => {
              const active = multiple ? (selected as string[]).includes(item.value) : selected === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  disabled={item.disabled}
                  aria-pressed={active}
                  aria-label={item.hint ? `${item.label} ${item.hint}` : item.label}
                  className="care-option-tiles__tile"
                  onClick={() => pick(item)}
                  style={{
                    borderColor: item.disabled ? token.colorBorderSecondary : active ? token.colorPrimary : token.colorBorder,
                    background: item.disabled ? token.colorFillTertiary : active ? token.colorPrimaryBg : token.colorBgContainer,
                    color: item.disabled ? token.colorTextDisabled : active ? token.colorPrimary : token.colorText,
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {item.hint ? (
                    <>
                      <span className="care-option-tiles__name">{item.label}</span>
                      <span className="care-option-tiles__date">{item.hint}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CareFestivalPicker({
  value,
  onChange,
  groups,
}: {
  value?: string;
  onChange?: (next: string) => void;
  groups: CareTileGroup[];
}) {
  return <CareOptionTiles value={value} onChange={(next) => onChange?.(String(next))} groups={groups} />;
}
