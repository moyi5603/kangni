import { orgDepartmentTree, orgPeopleByName, type OrgTreeNode } from './activity';
import type { PersonPresence, SignupOrg } from './signupApprovalFlow';

export const departmentLeaderNames: Record<string, string[]> = {
  研发中心: ['王芳'],
  前端组: ['张悦'],
  后端组: ['王芳'],
  测试组: ['苏然'],
  生产中心: ['周工'],
  总装车间: ['周工'],
  质检部: ['吴检'],
  营销中心: ['林销'],
  华东大区: ['陈产品'],
  华南大区: ['林销'],
  职能中心: ['赵人事'],
  人力资源: ['赵人事'],
  财务: ['钱会'],
};

const presenceOverlay = new Map<string, PersonPresence>();

export function setActivityPersonPresence(name: string, presence: PersonPresence) {
  if (presence === '在职') presenceOverlay.delete(name);
  else presenceOverlay.set(name, presence);
}

function parentMap(nodes: readonly OrgTreeNode[], parent?: string, into = new Map<string, string | undefined>()) {
  nodes.forEach((node) => {
    into.set(node.value, parent);
    if (node.children?.length) parentMap(node.children, node.value, into);
  });
  return into;
}

const departmentParents = parentMap(orgDepartmentTree);

function treeDepth(nodes: readonly OrgTreeNode[], depth = 1): number {
  return nodes.reduce((max, node) => Math.max(max, node.children?.length ? treeDepth(node.children, depth + 1) : depth), depth);
}

export function orgMaxParentHops(): number {
  return Math.max(0, treeDepth(orgDepartmentTree) - 1);
}

export function activitySignupOrg(): SignupOrg {
  return {
    person: (name) => {
      const found = orgPeopleByName[name];
      if (!found) return undefined;
      return { name, departmentId: found.department, presence: presenceOverlay.get(name) ?? '在职' };
    },
    parentDepartment: (departmentId) => departmentParents.get(departmentId),
    leaders: (departmentId) => departmentLeaderNames[departmentId] ?? [],
    hasDepartment: (departmentId) => departmentParents.has(departmentId),
  };
}
