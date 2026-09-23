import { resetActivityDecoration } from '../../activities/model/activityDecorationStore';
import { resetIgDecoration } from '../../interest-groups/model/igDecorationStore';
import { resetVoteV2Decoration } from '../../voting-v2/model/voteV2DecorationStore';

export function resetCEndPreviewDecorations() {
  resetActivityDecoration();
  resetIgDecoration();
  resetVoteV2Decoration();
}
