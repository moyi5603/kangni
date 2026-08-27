import { buildCommentThreads, type CommentThread } from '../../activities/model/commentTree';
import type { CommentRecord } from '../../activities/model/related';
import { getVoteComments } from './voteStore';
import type { VoteComment } from './voting';

export function voteCommentAsRecord(item: VoteComment): CommentRecord {
  return {
    id: item.id,
    activityId: item.campaignId,
    content: item.text,
    author: item.authorName,
    createdAt: item.createdAt,
    likedBy: item.likedBy,
    ...(item.parentId != null ? { parentId: item.parentId } : {}),
  };
}

export function listVoteCommentThreads(campaignId: number): CommentThread[] {
  return buildCommentThreads(getVoteComments(campaignId).map(voteCommentAsRecord));
}

export function voteCommentCount(campaignId: number): number {
  return listVoteCommentThreads(campaignId).length;
}
