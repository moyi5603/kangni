import { useState } from 'react';
import { goH5Back, toH5ContestChallengeHash } from '../../../../app/navigation';
import { enabledRegions } from '../../../skills-contest/model/contest';
import { addContestSignup, getContest, useContests } from '../../../skills-contest/model/contestStore';
import { getRegions } from '../../../skills-contest/model/regionStore';
import { REGION_FIELD_KEY } from '../../../skills-contest/model/contestSignupFields';
import { useCEndToast } from '../../activities/components/CEndToast';
import { DEMO_CONTEST_USER, mySignup, regionLabel } from '../model/clientContest';
import { H5ContestShell } from './H5ContestShell';

export function H5ContestSignup({ id }: { id: number }) {
  useContests();
  const toast = useCEndToast();
  const contest = getContest(id);
  const existing = contest ? mySignup(id) : undefined;
  const [name, setName] = useState(existing?.answers.姓名 ?? DEMO_CONTEST_USER.name);
  const [phone, setPhone] = useState(existing?.answers.手机号 ?? DEMO_CONTEST_USER.phone);
  const [regionId, setRegionId] = useState<number | ''>(existing?.regionId ?? '');

  if (!contest) {
    return (
      <H5ContestShell title="报名" onBack={goH5Back}>
        <p className="c-empty">赛事不存在</p>
      </H5ContestShell>
    );
  }

  if (existing) {
    return (
      <H5ContestShell title="报名" onBack={goH5Back}>
        <div className="c-contest-signup">
          <p className="c-contest-signed">你已报名 {contest.name}</p>
          <p>姓名：{existing.answers.姓名}</p>
          <p>区域：{regionLabel(existing.regionId)}</p>
          <a className="c-contest-cta" href={toH5ContestChallengeHash(id)}>
            去闯关
          </a>
        </div>
      </H5ContestShell>
    );
  }

  const regions = enabledRegions(getRegions());
  const submit = () => {
    if (!name.trim()) {
      toast.show('请填写姓名');
      return;
    }
    if (regionId === '') {
      toast.show('请选择所属区域');
      return;
    }
    addContestSignup({
      contestId: id,
      answers: { 姓名: name.trim(), 手机号: phone.trim() },
      regionId: Number(regionId),
    });
    toast.show('报名成功');
    window.location.hash = toH5ContestChallengeHash(id);
  };

  return (
    <H5ContestShell title="填写报名信息" onBack={goH5Back}>
      <form
        className="c-contest-signup"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <p className="c-contest-signup-title">{contest.name}</p>
        <label>
          姓名
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          手机号
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          {REGION_FIELD_KEY}
          <select value={regionId} onChange={(event) => setRegionId(event.target.value ? Number(event.target.value) : '')} required>
            <option value="">请选择</option>
            {regions.map((item) => (
              <option key={item.id} value={item.id}>
                {regionLabel(item.id)}
              </option>
            ))}
          </select>
        </label>
        <button className="c-contest-cta" type="submit">
          提交报名
        </button>
      </form>
    </H5ContestShell>
  );
}
