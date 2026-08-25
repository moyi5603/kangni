import type { AwardType } from './award';

const nameByType: Record<AwardType, string> = {
  个人: '年度优秀员工评优',
  团队: '季度卓越团队评优',
  项目: '重点项目攻坚评优',
};

const introByType: Record<AwardType, (name: string) => string> = {
  个人: (name) =>
    `「${name || '本届评优'}」面向全员，围绕业绩贡献、协作口碑与持续成长开展提名与投票。欢迎大家为身边的榜样发声，共同表彰在岗位上创造价值的同事。`,
  团队: (name) =>
    `「${name || '本届评优'}」聚焦跨部门协作与团队成效，鼓励推荐高效协同、成果突出的团队。通过提名与投票，让优秀团队实践被看见、被复制。`,
  项目: (name) =>
    `「${name || '本届评优'}」面向重点项目与攻坚课题，表彰目标达成、风险可控、交付优质的项目成果。欢迎提名有代表性、可复用的标杆项目。`,
};

const criteriaByType: Record<AwardType, string[]> = {
  个人: ['业绩目标达成情况与业务贡献', '跨团队协作与正向影响力', '持续学习与带动成长'],
  团队: ['团队目标达成与协作效率', '跨部门协同与资源整合能力', '可复制的优秀实践沉淀'],
  项目: ['项目目标达成与交付质量', '进度、成本与风险可控程度', '成果复用价值与组织贡献'],
};

export function generateAwardName(type: AwardType): string {
  return nameByType[type];
}

export function generateAwardIntro(type: AwardType, name: string): string {
  return introByType[type](name.trim());
}

export function generateAwardCriteria(type: AwardType): string[] {
  return [...criteriaByType[type]];
}
