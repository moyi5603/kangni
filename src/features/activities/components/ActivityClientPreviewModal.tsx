import { useState } from 'react';
import { Modal, Segmented } from 'antd';
import type { Activity } from '../model/activity';
import { CEndToastProvider } from '../../c-end/activities/components/CEndToast';
import { asClientPreviewActivity } from '../../c-end/activities/model/clientActivity';
import { H5ActivityDetail } from '../../c-end/activities/h5/H5ActivityDetail';
import { PcActivityDetail } from '../../c-end/activities/pc/PcActivityDetail';
import '../../c-end/activities/styles.css';

type Surface = 'pc' | 'h5';

type ActivityClientPreviewModalProps = {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
};

export function ActivityClientPreviewModal({ activity, open, onClose }: ActivityClientPreviewModalProps) {
  const [surface, setSurface] = useState<Surface>('pc');
  const preview = activity ? asClientPreviewActivity(activity) : null;

  return (
    <Modal
      title="页面预览"
      open={open && Boolean(preview)}
      onCancel={onClose}
      footer={null}
      width={surface === 'pc' ? 1120 : 480}
      destroyOnHidden
      className="activity-client-preview-modal"
    >
      <Segmented
        value={surface}
        onChange={(value) => setSurface(value as Surface)}
        options={[
          { label: 'PC', value: 'pc' },
          { label: 'H5', value: 'h5' },
        ]}
        style={{ marginBottom: 16 }}
      />
      {preview ? (
        <CEndToastProvider>
          <div className={`activity-client-preview is-${surface}`}>
            {surface === 'pc' ? (
              <PcActivityDetail id={preview.id} activity={preview} preview />
            ) : (
              <H5ActivityDetail id={preview.id} activity={preview} preview />
            )}
          </div>
        </CEndToastProvider>
      ) : null}
    </Modal>
  );
}
