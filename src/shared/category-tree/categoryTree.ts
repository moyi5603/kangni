export type CategoryNode = {
  id: number;
  name: string;
  children?: CategoryNode[];
};

export const CATEGORY_MAX_DEPTH = 3;

export function categoryDepthOf(nodes: CategoryNode[], id: number, depth = 1): number | null {
  for (const node of nodes) {
    if (node.id === id) return depth;
    if (node.children?.length) {
      const found = categoryDepthOf(node.children, id, depth + 1);
      if (found != null) return found;
    }
  }
  return null;
}

export function canAddCategoryChild(
  nodes: CategoryNode[],
  parentId: number | null,
  maxDepth = CATEGORY_MAX_DEPTH,
): boolean {
  if (parentId == null) return maxDepth >= 1;
  const depth = categoryDepthOf(nodes, parentId);
  return depth != null && depth < maxDepth;
}

export function collectCategoryIds(nodes: CategoryNode[]): number[] {
  const ids: number[] = [];
  function walk(list: CategoryNode[]) {
    for (const node of list) {
      ids.push(node.id);
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
  return ids;
}

export function findCategoryNode(nodes: CategoryNode[], id: number): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findCategoryNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function subtreeIdsOf(nodes: CategoryNode[], id: number): number[] {
  const node = findCategoryNode(nodes, id);
  return node ? collectCategoryIds([node]) : [id];
}

export function filterCategoryTree(nodes: CategoryNode[], keyword: string): CategoryNode[] {
  const q = keyword.trim();
  if (!q) return nodes;

  return nodes.reduce<CategoryNode[]>((acc, node) => {
    const filteredChildren = node.children ? filterCategoryTree(node.children, q) : [];
    const matched = node.name.includes(q);
    if (matched || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      });
    }
    return acc;
  }, []);
}

export function insertCategory(
  nodes: CategoryNode[],
  parentId: number,
  child: CategoryNode,
): CategoryNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), child] };
    }
    if (node.children?.length) {
      return { ...node, children: insertCategory(node.children, parentId, child) };
    }
    return node;
  });
}

export function renameCategoryInTree(nodes: CategoryNode[], id: number, name: string): CategoryNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, name };
    if (node.children?.length) {
      return { ...node, children: renameCategoryInTree(node.children, id, name) };
    }
    return node;
  });
}

export function removeCategoryFromTree(nodes: CategoryNode[], id: number): CategoryNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children?.length ? { ...node, children: removeCategoryFromTree(node.children, id) } : node,
    );
}

export function findCategorySiblingContext(
  nodes: CategoryNode[],
  id: number,
  parentId: number | null = null,
): { siblings: CategoryNode[]; index: number; parentId: number | null } | null {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) {
    return { siblings: nodes, index, parentId };
  }
  for (const node of nodes) {
    if (node.children?.length) {
      const found = findCategorySiblingContext(node.children, id, node.id);
      if (found) return found;
    }
  }
  return null;
}

export function updateCategoryChildren(
  nodes: CategoryNode[],
  parentId: number,
  updater: (children: CategoryNode[]) => CategoryNode[],
): CategoryNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: updater(node.children ?? []) };
    }
    if (node.children?.length) {
      return { ...node, children: updateCategoryChildren(node.children, parentId, updater) };
    }
    return node;
  });
}

export function isSiblingNameTaken(
  nodes: CategoryNode[],
  name: string,
  parentId: number | null,
  excludeId?: number,
): boolean {
  const siblings = parentId == null ? nodes : (findCategoryNode(nodes, parentId)?.children ?? []);
  return siblings.some((item) => item.name === name && item.id !== excludeId);
}
