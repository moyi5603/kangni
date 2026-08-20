import type { ClientActivity } from '../model/clientActivity';
import { IconComment, IconLike, IconStar } from './Icons';

export function SocialRow({ activity }: { activity: ClientActivity }) {
  return (
    <div className="c-social">
      <span>
        <IconLike />
        {activity.likes}
      </span>
      <span>
        <IconStar />
        {activity.stars}
      </span>
      <span>
        <IconComment />
        {activity.comments}
      </span>
    </div>
  );
}
