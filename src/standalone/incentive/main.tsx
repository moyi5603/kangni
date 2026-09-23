import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import '../../shared/dayjs-zh';
import { antdTheme } from '../../shared/design-system/generated/antd-theme.generated';
import '../../styles.css';
import { IncentiveStandaloneApp } from './IncentiveStandaloneApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntApp>
        <IncentiveStandaloneApp />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
