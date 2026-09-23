import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AppstoreOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MenuOutlined,
  ReadOutlined,
  RocketOutlined,
  TagsOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Drawer, Flex, Layout, Menu, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { b2bStandards } from '../shared/design-system/generated/b2b-standards.generated';
import { beginSuppressHash, consumeSuppressHash, requestNavigation } from '../app/navigationLeave';
import {
  applicationMenus,
  findMenuTrail,
  getApplication,
  getOpenKeys,
  isLeafMenuKey,
  parseLocationHash,
  siderSelectedKey,
  toLocationHash,
  type MenuNode,
  type NavIcon,
} from '../app/navigation';

const { Header, Sider, Content } = Layout;

const navIcons: Partial<Record<NavIcon, ReactNode>> = {
  appstore: <AppstoreOutlined />,
  calendar: <CalendarOutlined />,
  checkCircle: <CheckCircleOutlined />,
  dashboard: <DashboardOutlined />,
  fileText: <FileTextOutlined />,
  read: <ReadOutlined />,
  rocket: <RocketOutlined />,
  tags: <TagsOutlined />,
  trophy: <TrophyOutlined />,
  unorderedList: <UnorderedListOutlined />,
};

function toMenuItems(nodes: MenuNode[]): MenuProps['items'] {
  return nodes.map((node) => ({
    key: node.key,
    icon: navIcons[node.icon],
    label: node.label,
    children: node.children ? toMenuItems(node.children) : undefined,
  }));
}

function useNarrow(maxWidth = 900) {
  const [narrow, setNarrow] = useState(() => window.matchMedia(`(max-width: ${maxWidth}px)`).matches);
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = () => setNarrow(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [maxWidth]);
  return narrow;
}

function parseLockedHash(hash: string, applicationKey: string, defaultPage: string) {
  const parsed = parseLocationHash(hash);
  if (parsed.application !== applicationKey) {
    return { application: applicationKey, page: defaultPage, recordId: undefined as string | undefined };
  }
  return { application: applicationKey, page: parsed.page, recordId: parsed.recordId };
}

export function StandaloneAdminApp({
  applicationKey,
  renderPage,
}: {
  applicationKey: string;
  renderPage: (page: string, recordId: string | undefined, goToPage: (page: string, recordId?: string) => void) => ReactNode;
}) {
  const applicationMeta = getApplication(applicationKey);
  if (!applicationMeta) {
    throw new Error(`Unknown application: ${applicationKey}`);
  }

  const initial = parseLockedHash(window.location.hash, applicationKey, applicationMeta.defaultPage);
  const [page, setPage] = useState(initial.page);
  const [recordId, setRecordId] = useState(initial.recordId);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const narrow = useNarrow();
  const sideNodes = applicationMenus[applicationKey] ?? [];
  const layoutBg = b2bStandards.theme.token.colorBgLayout;
  const layoutStyle = {
    '--header-height': `${b2bStandards.theme.components.Layout.headerHeight}px`,
    '--content-max-width': `${b2bStandards.product.contentMaxWidth}px`,
    '--page-gutter': `${b2bStandards.product.pageGutter}px`,
    '--page-gutter-compact': `${b2bStandards.product.pageGutterCompact}px`,
    '--logo-width': `${b2bStandards.layout.logoWidth}px`,
    '--sidebar-width': `${b2bStandards.layout.sidebarWidth}px`,
    '--border-color': b2bStandards.border.color,
    '--spacing-md': `${b2bStandards.spacing.md}px`,
    '--admin-color-bg-layout': layoutBg,
    '--ant-layout-body-bg': layoutBg,
    background: layoutBg,
  } as CSSProperties;

  const syncLocation = (nextPage: string, nextRecordId?: string) => {
    const nextHash = toLocationHash(applicationKey, nextPage, nextRecordId);
    if (window.location.hash !== nextHash) {
      beginSuppressHash();
      window.location.hash = nextHash;
    }
  };

  const goToPage = (nextPage: string, nextRecordId?: string) => {
    if (page === nextPage && recordId === nextRecordId) return;
    requestNavigation(() => {
      setPage(nextPage);
      setRecordId(nextRecordId);
      setMenuDrawerOpen(false);
      syncLocation(nextPage, nextRecordId);
    });
  };

  useEffect(() => {
    const locked = parseLockedHash(window.location.hash, applicationKey, applicationMeta.defaultPage);
    const expected = toLocationHash(applicationKey, locked.page, locked.recordId);
    if (window.location.hash !== expected) {
      beginSuppressHash();
      window.location.hash = expected;
    }
  }, [applicationKey, applicationMeta.defaultPage]);

  useEffect(() => {
    const onHashChange = () => {
      if (consumeSuppressHash()) return;
      const next = parseLockedHash(window.location.hash, applicationKey, applicationMeta.defaultPage);
      requestNavigation(() => {
        setPage(next.page);
        setRecordId(next.recordId);
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [applicationKey, applicationMeta.defaultPage]);

  const selectedKey = siderSelectedKey(page);
  const trail = findMenuTrail(sideNodes, selectedKey);

  const renderSideMenu = () => (
    <Menu
      key={applicationKey}
      mode="inline"
      selectedKeys={[selectedKey]}
      defaultOpenKeys={getOpenKeys(sideNodes)}
      onClick={({ key }) => {
        if (!isLeafMenuKey(sideNodes, String(key))) return;
        goToPage(String(key));
      }}
      items={toMenuItems(sideNodes)}
    />
  );

  return (
    <Layout className="app-shell" style={layoutStyle}>
      <Header className="app-header">
        <div className="brand">
          {narrow ? (
            <Button
              className="sider-trigger"
              type="text"
              aria-label="打开应用菜单"
              icon={<MenuOutlined />}
              onClick={() => setMenuDrawerOpen(true)}
            />
          ) : null}
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">{applicationMeta.label}</span>
        </div>
        <nav className="application-nav" aria-label="当前应用">
          <Typography.Text className="current-application" style={{ display: 'inline' }}>
            {applicationMeta.label}
            {trail.at(-1) ? ` / ${trail.at(-1)?.label}` : ''}
          </Typography.Text>
        </nav>
        <div className="header-user">
          <Flex align="center" gap={18}>
            <Badge dot>
              <BellOutlined className="header-icon" />
            </Badge>
            <Space>
              <Avatar size={32} icon={<UserOutlined />} />
              <div className="user-copy">
                <Typography.Text strong>陈产品</Typography.Text>
                <Typography.Text type="secondary">产品管理员</Typography.Text>
              </div>
            </Space>
          </Flex>
        </div>
      </Header>
      <Layout className="app-body" style={{ background: layoutBg, ['--ant-layout-body-bg' as string]: layoutBg }}>
        {narrow ? null : (
          <Sider
            width={b2bStandards.layout.sidebarWidth}
            collapsedWidth={b2bStandards.layout.sidebarCollapsedWidth}
            theme="light"
            className="app-sider"
          >
            {renderSideMenu()}
          </Sider>
        )}
        <Content className="app-content" style={{ background: layoutBg }}>
          {renderPage(page, recordId, goToPage)}
        </Content>
      </Layout>
      {narrow ? (
        <Drawer
          placement="left"
          size={b2bStandards.layout.sidebarWidth}
          open={menuDrawerOpen}
          onClose={() => setMenuDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
        >
          {renderSideMenu()}
        </Drawer>
      ) : null}
    </Layout>
  );
}
