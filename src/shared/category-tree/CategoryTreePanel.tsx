import { useMemo, useState, type Key } from 'react';
import { EllipsisOutlined, MinusSquareOutlined, PlusOutlined, PlusSquareOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, ConfigProvider, Dropdown, Empty, Flex, Input, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { b2bStandards } from '../design-system/generated/b2b-standards.generated';
import { CATEGORY_MAX_DEPTH, collectCategoryIds, filterCategoryTree, type CategoryNode } from './categoryTree';

const TREE_INDENT = 24;
const TREE_ROW_H = 36;
const TREE_ROW_CENTER = 18;
const TREE_SWITCHER_CENTER = 12;

function switcherCenterRowX(depth: number): number {
  return (depth + 1) * TREE_INDENT + TREE_SWITCHER_CENTER;
}

function parentColumnRowX(depth: number): number {
  return depth * TREE_INDENT + TREE_SWITCHER_CENTER;
}

function ancestorColumnRowX(indentIndex: number): number {
  return indentIndex * TREE_INDENT + TREE_SWITCHER_CENTER;
}

function rowLineAreaWidth(depth: number): number {
  return (depth + 2) * TREE_INDENT;
}

function renderTreeLines(
  depth: number,
  isLastChild: boolean,
  ancestorLastFlags: boolean[],
  lineColor: string,
  options: { expanded?: boolean; isLeaf: boolean },
): React.ReactNode[] {
  const dashArr = '3 3';
  const lines: React.ReactNode[] = [];

  if (depth < 0) {
    if (!options.isLeaf && options.expanded) {
      lines.push(
        <line
          key="v-down"
          x1={switcherCenterRowX(depth)}
          y1={TREE_ROW_CENTER}
          x2={switcherCenterRowX(depth)}
          y2={TREE_ROW_H + 1}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray={dashArr}
        />,
      );
    }
    return lines;
  }

  const switcherX = switcherCenterRowX(depth);
  const parentX = parentColumnRowX(depth);

  ancestorLastFlags.forEach((isLast, i) => {
    if (!isLast) {
      const x = ancestorColumnRowX(i);
      lines.push(
        <line
          key={`av-${i}`}
          x1={x}
          y1={-1}
          x2={x}
          y2={TREE_ROW_H + 1}
          stroke={lineColor}
          strokeWidth={1}
          strokeDasharray={dashArr}
        />,
      );
    }
  });

  lines.push(
    <line
      key="h"
      x1={parentX}
      y1={TREE_ROW_CENTER}
      x2={switcherX}
      y2={TREE_ROW_CENTER}
      stroke={lineColor}
      strokeWidth={1}
      strokeDasharray={dashArr}
    />,
    <line
      key="v-up"
      x1={parentX}
      y1={-1}
      x2={parentX}
      y2={TREE_ROW_CENTER}
      stroke={lineColor}
      strokeWidth={1}
      strokeDasharray={dashArr}
    />,
  );

  if (!isLastChild) {
    lines.push(
      <line
        key="v-sib"
        x1={parentX}
        y1={TREE_ROW_CENTER}
        x2={parentX}
        y2={TREE_ROW_H + 1}
        stroke={lineColor}
        strokeWidth={1}
        strokeDasharray={dashArr}
      />,
    );
  }

  if (!options.isLeaf && options.expanded) {
    lines.push(
      <line
        key="v-down"
        x1={switcherX}
        y1={TREE_ROW_CENTER}
        x2={switcherX}
        y2={TREE_ROW_H + 1}
        stroke={lineColor}
        strokeWidth={1}
        strokeDasharray={dashArr}
      />,
    );
  }

  return lines;
}

function TreeLineSvg({ depth, lines }: { depth: number; lines: React.ReactNode[] }) {
  if (!lines.length) return null;
  const width = rowLineAreaWidth(depth);
  return (
    <svg
      width={width}
      height={TREE_ROW_H}
      viewBox={`0 0 ${width} ${TREE_ROW_H}`}
      style={{ overflow: 'visible', pointerEvents: 'none', display: 'block' }}
    >
      {lines}
    </svg>
  );
}

interface LinedTreeNode extends DataNode {
  depth: number;
  isLastChild: boolean;
  ancestorLastFlags: boolean[];
}

function toTreeData(nodes: CategoryNode[], depth = 0, ancestorLastFlags: boolean[] = []): LinedTreeNode[] {
  return nodes.map((node, idx) => {
    const isLastChild = idx === nodes.length - 1;
    const children = node.children?.length
      ? toTreeData(node.children, depth + 1, [...ancestorLastFlags, isLastChild])
      : undefined;
    return {
      key: node.id,
      title: node.name,
      isLeaf: !node.children?.length,
      depth,
      isLastChild,
      ancestorLastFlags,
      children,
    };
  });
}

export function CategoryTreePanel({
  tree,
  selectedKey,
  onSelect,
  expandedKeys,
  onExpand,
  searchPlaceholder = '搜索分类',
  createLabel = '新建分类',
  onCreateRoot,
  onCreateChild,
  onEdit,
  onMove,
  onDelete,
  getSiblingIndex,
  maxHeight,
  readOnly = false,
  maxDepth = CATEGORY_MAX_DEPTH,
}: {
  tree: CategoryNode[];
  selectedKey: number | null;
  onSelect: (key: number | null) => void;
  expandedKeys?: Key[];
  onExpand: (keys: Key[]) => void;
  searchPlaceholder?: string;
  createLabel?: string;
  onCreateRoot?: () => void;
  onCreateChild?: (parentId: number) => void;
  onEdit?: (id: number) => void;
  onMove?: (id: number, direction: 'up' | 'down') => void;
  onDelete?: (id: number, name: string) => void;
  getSiblingIndex?: (id: number) => { index: number; total: number } | null;
  maxHeight: string;
  readOnly?: boolean;
  maxDepth?: number;
}) {
  const [categorySearch, setCategorySearch] = useState('');
  const categorySearchTrimmed = categorySearch.trim();
  const isCategorySearching = categorySearchTrimmed.length > 0;
  const filteredTree = useMemo(
    () => filterCategoryTree(tree, categorySearchTrimmed),
    [tree, categorySearchTrimmed],
  );
  const treeData = useMemo(() => toTreeData(filteredTree), [filteredTree]);
  const allCategoryTreeData = useMemo(
    () =>
      [
        {
          key: -1,
          title: '全部',
          isLeaf: false,
          depth: -1,
          isLastChild: true,
          ancestorLastFlags: [],
          children: treeData,
        } as LinedTreeNode,
      ],
    [treeData],
  );
  const searchExpandedKeys = useMemo(
    () => [-1, ...collectCategoryIds(filteredTree)] as Key[],
    [filteredTree],
  );
  const treeExpandedKeys = isCategorySearching ? searchExpandedKeys : expandedKeys;

  const renderTreeTitle = (node: DataNode) => {
    const lined = node as LinedTreeNode;
    const isRoot = node.key === -1;
    const title = String(node.title);
    const isLeaf = lined.isLeaf ?? false;
    const isExpanded = !isLeaf && (expandedKeys === undefined || expandedKeys.includes(node.key));
    const rowLines = renderTreeLines(lined.depth, lined.isLastChild, lined.ancestorLastFlags, b2bStandards.border.color, {
      isLeaf,
      expanded: isExpanded,
    });
    const lineAreaWidth = rowLineAreaWidth(lined.depth);
    const categoryId = Number(node.key);
    const siblingIndex = isRoot || !getSiblingIndex ? null : getSiblingIndex(categoryId);

    return (
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        className="cw-tree-title-wrap"
        style={{ flex: 1, minWidth: 0, width: '100%' }}
      >
        {rowLines.length > 0 && (
          <span className="cw-tree-row-lines" aria-hidden style={{ left: -lineAreaWidth, width: lineAreaWidth }}>
            <TreeLineSvg depth={lined.depth} lines={rowLines} />
          </span>
        )}
        <Typography.Text ellipsis={{ tooltip: title }} style={{ flex: 1, fontSize: 14 }}>
          {title}
        </Typography.Text>
        {readOnly ? null : (
          <Dropdown
            menu={{
              items: isRoot
                ? [
                    {
                      key: 'add-child',
                      label: '添加子分类',
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        onCreateRoot?.();
                      },
                    },
                  ]
                : [
                    {
                      key: 'edit',
                      label: '编辑分类',
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        onEdit?.(categoryId);
                      },
                    },
                    ...(lined.depth + 1 < maxDepth
                      ? [
                          {
                            key: 'add-child',
                            label: '添加子分类',
                            onClick: ({ domEvent }: { domEvent: React.MouseEvent }) => {
                              domEvent.stopPropagation();
                              onCreateChild?.(categoryId);
                            },
                          },
                        ]
                      : []),
                    {
                      key: 'move-up',
                      label: '上移',
                      disabled: siblingIndex?.index === 0,
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        onMove?.(categoryId, 'up');
                      },
                    },
                    {
                      key: 'move-down',
                      label: '下移',
                      disabled: siblingIndex != null && siblingIndex.index >= siblingIndex.total - 1,
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        onMove?.(categoryId, 'down');
                      },
                    },
                    { type: 'divider' },
                    {
                      key: 'delete',
                      label: '删除',
                      danger: true,
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        onDelete?.(categoryId, title);
                      },
                    },
                  ],
            }}
            trigger={['click']}
          >
            <Button
              size="small"
              type="text"
              icon={<EllipsisOutlined />}
              aria-label={`${title} 更多操作`}
              onClick={(e) => e.stopPropagation()}
              style={{ flexShrink: 0 }}
            />
          </Dropdown>
        )}
      </Flex>
    );
  };

  return (
    <Card
      variant="borderless"
      style={{
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: maxHeight,
        maxHeight,
      }}
      styles={{
        body: {
          padding: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        },
      }}
    >
      <div style={{ padding: `${b2bStandards.spacing.sm}px ${b2bStandards.spacing.sm}px 0` }}>
        <Input
          allowClear
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined />}
          value={categorySearch}
          onChange={(event) => setCategorySearch(event.target.value)}
        />
      </div>
      <style>{`
        .category-tree .ant-tree-treenode {
          margin-bottom: 0;
          padding-bottom: 0;
          width: 100%;
          position: relative;
          overflow: visible;
        }
        .category-tree .ant-tree-indent { overflow: visible; }
        .category-tree .ant-tree-node-content-wrapper {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          position: relative;
          overflow: visible;
          padding-inline-start: 0;
        }
        .category-tree .ant-tree-title {
          flex: 1;
          min-width: 0;
          width: 100%;
          overflow: visible;
        }
        .category-tree .ant-tree-title > .ant-flex { width: 100%; }
        .category-tree .cw-tree-title-wrap { position: relative; }
        .category-tree .cw-tree-row-lines {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 36px;
          pointer-events: none;
          z-index: 0;
        }
        .category-tree .ant-tree-switcher-icon { position: relative; z-index: 1; }
        .category-tree .ant-tree-switcher,
        .category-tree .ant-tree-switcher-noop {
          overflow: visible;
          width: 24px !important;
          min-width: 24px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-inline-end: 0 !important;
        }
        .category-tree .ant-tree-switcher-leaf-line { display: none !important; }
      `}</style>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingTop: b2bStandards.spacing.sm }}>
        {isCategorySearching && filteredTree.length === 0 ? (
          <Empty description="未找到分类" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '24px 0' }} />
        ) : (
          <ConfigProvider
            theme={{
              components: {
                Tree: {
                  titleHeight: 36,
                  indentSize: 24,
                  nodeHoverBg: 'rgba(0,0,0,0.04)',
                  nodeSelectedBg: '#e6f4ff',
                  nodeSelectedColor: b2bStandards.theme.token.colorPrimary,
                },
              },
            }}
          >
            <Tree
              className="category-tree"
              blockNode
              showLine={false}
              switcherIcon={({ expanded, isLeaf }: { expanded?: boolean; isLeaf?: boolean }) =>
                isLeaf ? null : expanded ? (
                  <MinusSquareOutlined style={{ fontSize: 14, color: b2bStandards.theme.token.colorTextTertiary }} />
                ) : (
                  <PlusSquareOutlined style={{ fontSize: 14, color: b2bStandards.theme.token.colorTextTertiary }} />
                )
              }
              treeData={allCategoryTreeData}
              defaultExpandAll={!isCategorySearching}
              titleRender={renderTreeTitle}
              selectedKeys={selectedKey === null ? [-1] : [selectedKey]}
              {...(treeExpandedKeys ? { expandedKeys: treeExpandedKeys } : {})}
              onExpand={(keys) => onExpand(keys)}
              onSelect={(keys) => {
                const key = keys[0];
                if (key === undefined || key === -1) onSelect(null);
                else onSelect(Number(key));
              }}
              style={{ padding: `0 ${b2bStandards.spacing.xs}px` }}
            />
          </ConfigProvider>
        )}
      </div>
      {!readOnly ? (
        <div
          style={{
            flexShrink: 0,
            padding: b2bStandards.spacing.sm,
            borderTop: `1px solid ${b2bStandards.border.color}`,
            background: '#fff',
          }}
        >
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => onCreateRoot?.()}>
            {createLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
