import { useEffect, useState } from 'react';
import { CalendarOutlined, AppstoreOutlined, PictureOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons';
import { DecorationWorkbench } from '../../../shared/decoration/DecorationWorkbench';
import type { DecoSurface } from '../../../shared/decoration/decoTypes';
import { IgBannerLinkPicker } from './IgBannerLinkPicker';
import {
  createIgDecoBlock,
  IG_DECO_TYPE_LABEL,
  igDecoStylesForType,
} from '../model/igDecoration';
import {
  DECO_ACTIVITY_CARD_FIELD_TOGGLES,
  DECO_GROUP_CARD_FIELD_TOGGLES,
  DECO_MOMENT_CARD_FIELD_TOGGLES,
} from '../../../shared/decoration/decoCardFields';
import { publishIgDecoration, saveIgDecoration, useIgDecoration } from '../model/igDecorationStore';

export function IgDecorationPage({ surface: initialSurface = 'mobile' }: { surface?: DecoSurface }) {
  const [surface, setSurface] = useState<DecoSurface>(initialSurface);
  useEffect(() => {
    setSurface(initialSurface);
  }, [initialSurface]);
  const page = useIgDecoration(surface);
  return (
    <DecorationWorkbench
      surface={surface}
      onSurfaceChange={setSurface}
      appLabel="兴趣圈"
      workbenchTitle="兴趣圈装修"
      mineLabel="我的兴趣圈"
      mime="application/x-ig-deco"
      defaultSelectedId="deco-activity"
      typeLabels={IG_DECO_TYPE_LABEL}
      palette={[
        { type: 'search', label: '搜索', icon: <SearchOutlined /> },
        { type: 'ai', label: 'AI助手', icon: <StarOutlined /> },
        { type: 'banner', label: '轮播图', icon: <PictureOutlined /> },
        { type: 'groups', label: '兴趣圈', icon: <AppstoreOutlined /> },
        { type: 'activity', label: '活动', icon: <CalendarOutlined /> },
        { type: 'moments', label: '精彩瞬间', icon: <PictureOutlined /> },
      ]}
      chromeTabs={{
        activity: { aria: '活动排序', tabs: ['推荐', '最新', '热门'] },
      }}
      moreLinkOptions={[
        { value: 'allGroups', label: '全部兴趣圈' },
        { value: 'allActs', label: '全部活动' },
        { value: 'moments', label: '圈子瞬间' },
      ]}
      countUnit={(type) => (type === 'groups' ? '个兴趣圈' : '个活动')}
      stylesForType={igDecoStylesForType}
      fieldTogglesForType={(type) =>
        type === 'activity'
          ? DECO_ACTIVITY_CARD_FIELD_TOGGLES
          : type === 'groups'
            ? DECO_GROUP_CARD_FIELD_TOGGLES
            : type === 'moments'
              ? DECO_MOMENT_CARD_FIELD_TOGGLES
              : []
      }
      enableActivityTabSettings
      page={page}
      save={(next) => saveIgDecoration(surface, next)}
      publish={() => publishIgDecoration(surface)}
      createBlock={createIgDecoBlock}
      renderBannerLink={(props) => <IgBannerLinkPicker {...props} />}
    />
  );
}
