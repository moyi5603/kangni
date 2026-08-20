import { IconComment, IconLike, IconStar } from './Icons';

export function DetailEngageBar({
  liked,
  favorited,
  likes,
  stars,
  comments,
  onLike,
  onFavorite,
  onComment,
  showLike = true,
  showFavorite = true,
  showComment = true,
}: {
  liked: boolean;
  favorited: boolean;
  likes: number;
  stars: number;
  comments: number;
  onLike: () => void;
  onFavorite: () => void;
  onComment: () => void;
  showLike?: boolean;
  showFavorite?: boolean;
  showComment?: boolean;
}) {
  if (!showLike && !showFavorite && !showComment) return null;

  return (
    <div className="c-engage">
      {showLike ? (
        <button
          className={`c-engage-btn${liked ? ' is-on' : ''}`}
          type="button"
          aria-label={liked ? '取消点赞' : '点赞'}
          aria-pressed={liked}
          onClick={onLike}
        >
          <IconLike />
          {likes}
        </button>
      ) : null}
      {showFavorite ? (
        <button
          className={`c-engage-btn${favorited ? ' is-on' : ''}`}
          type="button"
          aria-label={favorited ? '取消收藏' : '收藏'}
          aria-pressed={favorited}
          onClick={onFavorite}
        >
          <IconStar />
          {stars}
        </button>
      ) : null}
      {showComment ? (
        <button className="c-engage-btn" type="button" aria-label="评论" onClick={onComment}>
          <IconComment />
          {comments}
        </button>
      ) : null}
    </div>
  );
}
