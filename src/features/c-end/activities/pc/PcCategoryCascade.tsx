export type CascadeL1Option = {
  id: number | null;
  name: string;
};

export type CascadeSubOption = {
  id: number | 'all';
  name: string;
};

type PcCategoryCascadeProps = {
  l1Id: number | null;
  l1Options: CascadeL1Option[];
  onL1Change: (id: number | null) => void;
  l2Id: number | 'all';
  l2Options: CascadeSubOption[];
  onL2Change: (id: number | 'all') => void;
  l3Id: number | 'all';
  l3Options: CascadeSubOption[];
  onL3Change: (id: number | 'all') => void;
};

function parseL1(value: string): number | null {
  if (value === '') return null;
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function parseSub(value: string): number | 'all' {
  if (value === 'all') return 'all';
  const id = Number(value);
  return Number.isFinite(id) ? id : 'all';
}

function SubSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | 'all';
  options: CascadeSubOption[];
  onChange: (id: number | 'all') => void;
}) {
  const disabled = options.length === 0;
  return (
    <label className="c-pc-cat-field">
      <span>{label}</span>
      <select
        aria-label={label}
        disabled={disabled}
        value={disabled ? 'all' : String(value)}
        onChange={(event) => onChange(parseSub(event.target.value))}
      >
        {(disabled ? [{ id: 'all' as const, name: '全部' }] : options).map((option) => (
          <option key={String(option.id)} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PcCategoryCascade({
  l1Id,
  l1Options,
  onL1Change,
  l2Id,
  l2Options,
  onL2Change,
  l3Id,
  l3Options,
  onL3Change,
}: PcCategoryCascadeProps) {
  return (
    <div className="c-pc-cat-cascade">
      <label className="c-pc-cat-field">
        <span>一级分类</span>
        <select
          aria-label="一级分类"
          value={l1Id == null ? '' : String(l1Id)}
          onChange={(event) => onL1Change(parseL1(event.target.value))}
        >
          {l1Options.map((option) => (
            <option key={String(option.id)} value={option.id == null ? '' : String(option.id)}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <SubSelect label="二级分类" value={l2Id} options={l2Options} onChange={onL2Change} />
      <SubSelect label="三级分类" value={l3Id} options={l3Options} onChange={onL3Change} />
    </div>
  );
}
