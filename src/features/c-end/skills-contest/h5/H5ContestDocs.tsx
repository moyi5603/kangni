import { goH5Back } from '../../../../app/navigation';
import { H5ContestShell } from './H5ContestShell';

const DOCS = [
  { id: 'rule', title: '线上初赛和复赛学分规则', hint: '计分、晋级与学分兑换' },
  { id: 'map', title: '闯关地图使用说明', hint: '关卡、地图与每日次数' },
  { id: 'faq', title: '竞赛常见问题', hint: '报名、设备与成绩查询' },
];

export function H5ContestDocs() {
  return (
    <H5ContestShell title="竞赛文档" onBack={goH5Back} tab="docs">
      <ul className="c-contest-docs">
        {DOCS.map((item) => (
          <li key={item.id}>
            <article>
              <h2>{item.title}</h2>
              <p>{item.hint}</p>
            </article>
          </li>
        ))}
      </ul>
    </H5ContestShell>
  );
}
