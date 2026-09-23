import { useState } from 'react';
import {
  orgPeople,
  orgPeoplePickerTree,
  personDepartment,
  type OrgTreeNode,
} from '../../../activities/model/activity';
import { useIg } from './IgContext';

type PickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
  ariaLabel?: string;
};

type PanelProps = {
  value: string[];
  onChange: (next: string[]) => void;
  onDone?: () => void;
};

function toggleName(value: string[], name: string): string[] {
  return value.includes(name) ? value.filter((item) => item !== name) : [...value, name];
}

/** 组织架构选人面板：面包屑逐层进入部门 + 姓名搜索 + 已选栏。 */
export function OrgPeoplePickerPanel({ value, onChange, onDone }: PanelProps) {
  const [path, setPath] = useState<OrgTreeNode[]>([]);
  const [query, setQuery] = useState('');

  const keyword = query.trim();
  const searching = keyword.length > 0;
  const hits = searching ? orgPeople.filter((person) => person.name.includes(keyword)) : [];

  const currentNodes = path.length ? path[path.length - 1].children ?? [] : orgPeoplePickerTree;
  const depts = currentNodes.filter((node) => Boolean(node.children?.length));
  const people = currentNodes.filter((node) => !node.children?.length);

  const personRow = (name: string, dept?: string) => (
    <label key={name} className="c-ig-lead-option">
      <input type="checkbox" checked={value.includes(name)} onChange={() => onChange(toggleName(value, name))} />
      <span>{name}</span>
      <span className="c-ig-lead-dept">{dept ?? personDepartment(name)}</span>
    </label>
  );

  return (
    <div className="c-ig-orgpick">
      <div className="c-ig-orgpick-search">
        <input
          className="c-ig-input"
          type="search"
          placeholder="搜索姓名"
          aria-label="搜索姓名"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {searching ? (
        <div className="c-ig-orgpick-list">
          {hits.map((person) => personRow(person.name, person.department))}
          {hits.length === 0 ? <div className="c-ig-orgpick-empty">未找到「{keyword}」</div> : null}
        </div>
      ) : (
        <>
          <div className="c-ig-orgpick-crumb" aria-label="组织层级">
            <button type="button" className={path.length ? undefined : 'is-current'} onClick={() => setPath([])}>
              组织
            </button>
            {path.map((node, index) => (
              <span key={node.value} className="c-ig-orgpick-crumb-item">
                <span className="c-ig-orgpick-crumb-sep">/</span>
                <button
                  type="button"
                  className={index === path.length - 1 ? 'is-current' : undefined}
                  onClick={() => setPath(path.slice(0, index + 1))}
                >
                  {node.title}
                </button>
              </span>
            ))}
          </div>
          <div className="c-ig-orgpick-list">
            {depts.map((dept) => (
              <button
                key={dept.value}
                type="button"
                className="c-ig-orgpick-dept"
                onClick={() => setPath([...path, dept])}
              >
                <span>{dept.title}</span>
                <span className="c-ig-orgpick-dept-arrow" aria-hidden>
                  ›
                </span>
              </button>
            ))}
            {people.map((node) => personRow(node.value))}
            {depts.length === 0 && people.length === 0 ? (
              <div className="c-ig-orgpick-empty">该部门暂无成员</div>
            ) : null}
          </div>
        </>
      )}
      <div className="c-ig-orgpick-footer">
        <span className="c-ig-orgpick-count">
          已选 {value.length} 人{value.length ? `：${value.join('、')}` : ''}
        </span>
        {value.length ? (
          <button type="button" className="c-ig-orgpick-clear" onClick={() => onChange([])}>
            清空
          </button>
        ) : null}
        {onDone ? (
          <button type="button" className="c-ig-orgpick-done" onClick={onDone}>
            完成
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** 字段 + 弹层组织架构选人（H5 底部弹层 / PC 居中弹窗）。 */
export function OrgPeopleTreePicker({ value, onChange, ariaLabel = '组织架构选人' }: PickerProps) {
  const { surface } = useIg();
  const [open, setOpen] = useState(false);

  return (
    <div className="c-ig-lead-picker">
      <div
        className="c-ig-input c-ig-lead-field"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {value.length ? (
          <span className="c-ig-lead-tags">
            {value.map((name) => (
              <span key={name} className="c-ig-lead-tag-item">
                {name}
                <span
                  className="c-ig-lead-tag-x"
                  role="button"
                  aria-label={`移除${name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(value.filter((item) => item !== name));
                  }}
                >
                  ×
                </span>
              </span>
            ))}
          </span>
        ) : (
          <span className="c-ig-lead-placeholder">请选择负责人</span>
        )}
      </div>
      {open ? (
        <div className="c-ig-orgpick-mask" onClick={() => setOpen(false)}>
          <div
            className={surface === 'pc' ? 'c-ig-orgpick-dialog is-pc' : 'c-ig-orgpick-dialog'}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="c-ig-orgpick-head">
              <span>选择负责人</span>
              <button type="button" aria-label="关闭" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <OrgPeoplePickerPanel value={value} onChange={onChange} onDone={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
