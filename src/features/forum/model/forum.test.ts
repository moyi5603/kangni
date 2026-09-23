import { describe, expect, it } from 'vitest';
import {
  boardFromDraft,
  canToggleBoardStatus,
  compareForumTags,
  countBoardTagUsage,
  countForumTagUsage,
  draftFromBoard,
  duplicateBoardName,
  duplicateMailboxManager,
  occupiedMailboxManagerNames,
  withOccupiedMailboxManagers,
  enabledForumTagNames,
  filterBoards,
  moveBoardAmongKind,
  filterForumTags,
  filterTopics,
  forumOrgTree,
  forumPeoplePickerTree,
  flattenForumOrgValues,
  FORUM_USER_OPTIONS,
  initialBoards,
  initialForumTags,
  forumAdminSelf,
  forumCommentReplyAccountOptions,
  isForumCommentReplyAccount,
  initialMutes,
  initialTopics,
  isMailboxBoard,
  isTopicPinned,
  muteStatusLabel,
  nextForumTagOrder,
  validateMuteDraft,
  privacyText,
  onlyForumPeople,
  parseTopicAssignees,
  topicAssigneeHasReplied,
  topicAssigneeText,
  topicCommentCount,
  topicManagementLabels,
  tagsByScope,
  topicAuthorAdminText,
  MAILBOX_RESPONSE_SLA_OPTIONS,
  validateBoardDraft,
  validateForumComment,
  validateForumTagName,
  withTopicComment,
  withTopicCommentPin,
  withTopicReply,
  withChairmanReply,
  topicChairmanReplies,
  topicActualReplierText,
  sortPinnedComments,
  pageMainComments,
  FORUM_MAIN_COMMENT_PAGE_SIZE,
  forumPersonDepartmentText,
  topicAssigneeDepartmentText,
  type ForumBoardDraft,
} from './forum';

describe('forum domain', () => {
  it('splits 论坛 and 信箱 by board kind', () => {
    expect(initialBoards.filter((item) => !isMailboxBoard(item)).map((item) => item.name)).toEqual([
      '二手论坛',
      '建议论坛',
    ]);
    expect(initialBoards.filter(isMailboxBoard).map((item) => item.name)).toEqual(['员工体验', '经营发展', '人才发展', '建言献策']);
    expect(privacyText(initialBoards[0])).toBe('公开');
    expect(privacyText(initialBoards[2])).toBe('私密');
    const moved = moveBoardAmongKind(initialBoards, initialBoards.find((item) => item.name === '经营发展')!.id, -1);
    expect(moved?.filter(isMailboxBoard).map((item) => item.name)).toEqual(['经营发展', '员工体验', '人才发展', '建言献策']);
    expect(moved?.filter((item) => !isMailboxBoard(item)).map((item) => item.name)).toEqual(['二手论坛', '建议论坛']);
    expect(moveBoardAmongKind(initialBoards, initialBoards.find((item) => item.name === '员工体验')!.id, -1)).toBeNull();
    expect(privacyText(initialBoards[0])).toBe('公开');
    expect(initialBoards[0]?.visibility).toBe('全员');
  });

  it('filters boards by name, status, org, manager, anonymous and created date', () => {
    const rows = filterBoards(initialBoards, {
      kind: 'forum',
      name: '建议',
      status: 'enabled',
      visibility: '全员',
      manager: '李晴',
      anonymous: 'true',
      createdFrom: '2026-08-11',
      createdTo: '2026-08-11',
    });
    expect(rows.map((item) => item.name)).toEqual(['建议论坛']);
  });

  it('keeps 帖子管理 off mailbox boards and 建言管理 on mailbox boards', () => {
    const posts = filterTopics(initialTopics, initialBoards, { kind: 'forum', keyword: '人体工学椅' });
    expect(posts).toHaveLength(1);
    expect(posts[0]?.boardName).toBe('二手论坛');
    const advice = filterTopics(initialTopics, initialBoards, { kind: 'mailbox' });
    expect(advice.every((item) => ['员工体验', '经营发展', '人才发展', '建言献策'].includes(item.boardName))).toBe(true);
    expect(advice.length).toBeGreaterThan(0);
    expect(advice.some((item) => item.title.includes('跨部门'))).toBe(true);
  });

  it('lets 二手论坛 allow anonymous and seeds the display post as anonymous 唐宇', () => {
    expect(initialBoards[0]?.anonymous).toBe(true);
    const display = initialTopics.find((item) => item.title.includes('27英寸显示器'))!;
    expect(display.author).toBe('唐宇');
    expect(display.authorAnonymous).toBe(true);
    expect(topicAuthorAdminText(display)).toBe('匿名（唐宇）');
    expect(display.comments[0]?.authorAnonymous).toBe(true);
    expect(display.comments[0]?.replies[0]?.authorAnonymous).toBe(true);
  });

  it('filters topics by management status, author and chair', () => {
    const pinned = filterTopics(initialTopics, initialBoards, { kind: 'forum', management: '置顶' });
    expect(pinned.every((item) => topicManagementLabels(item).includes('置顶'))).toBe(true);
    expect(pinned.some((item) => item.title.includes('低糖早餐'))).toBe(true);
    const byAuthor = filterTopics(initialTopics, initialBoards, { kind: 'forum', author: '唐宇' });
    expect(byAuthor.map((item) => item.author)).toEqual(['唐宇']);
    const byChair = filterTopics(initialTopics, initialBoards, { kind: 'mailbox', chairName: '林知夏' });
    expect(byChair.length).toBeGreaterThan(0);
    expect(byChair.every((item) => item.chairName === '林知夏')).toBe(true);
  });

  it('sorts pinned topics above unpinned ones', () => {
    const posts = filterTopics(initialTopics, initialBoards, { kind: 'forum' });
    expect(posts[0]?.title).toContain('人体工学椅');
    expect(posts[1]?.title).toContain('低糖早餐');
    expect(posts[2]?.title).toContain('晚班通勤班车');
    expect(posts.filter((item) => item.pinScope).every((item, index) => posts[index] === item)).toBe(true);
  });

  it('shows 未指派 until reply assignees are set', () => {
    expect(topicAssigneeText(undefined)).toBe('未指派');
    expect(topicAssigneeText('')).toBe('未指派');
    expect(topicAssigneeText('李晴、何安')).toBe('李晴、何安');
    expect(initialTopics[0]?.replyAssignees).toBeUndefined();
    expect(initialTopics[4]?.replyAssignees).toBe('李晴、何安');
    expect(forumPersonDepartmentText('王涛')).toBe('社区运营');
    expect(forumPersonDepartmentText('周敏')).toBe('市场品牌部');
    expect(forumPersonDepartmentText('管宁')).toBe('平台运营部');
    expect(forumPersonDepartmentText('陈产品')).toBe('华东大区');
    expect(forumPersonDepartmentText('论坛小助手')).toBe('平台运营部');
    expect(forumPersonDepartmentText('官方客服')).toBe('平台运营部');
    expect(forumPersonDepartmentText('林知夏')).toBe('信箱办公室');
    expect(forumPersonDepartmentText('匿名用户')).toBe('—');
    expect(forumPersonDepartmentText('陈某')).toBe('—');
    expect(forumPersonDepartmentText('彭越')).toBe('供应链中心');
  });

  it('renders admin initiator as 匿名（真实姓名） when the post is anonymous', () => {
    expect(topicAuthorAdminText({ author: '王涛' })).toBe('王涛');
    expect(topicAuthorAdminText({ author: '彭越', authorAnonymous: true })).toBe('匿名（彭越）');
    const advice = initialTopics.find((item) => item.title.includes('跨部门'))!;
    expect(advice.author).toBe('彭越');
    expect(advice.authorAnonymous).toBe(true);
    expect(topicAuthorAdminText(advice)).toBe('匿名（彭越）');
    const forumAnon = initialTopics.find((item) => item.title.includes('会议室预约'))!;
    expect(forumAnon.author).toBe('谢琳');
    expect(forumAnon.authorAnonymous).toBe(true);
    expect(topicAuthorAdminText(forumAnon)).toBe('匿名（谢琳）');
    expect(topicAuthorAdminText(initialTopics[0]!)).toBe('周敏');
    expect(filterTopics(initialTopics, initialBoards, { kind: 'mailbox', author: '匿名' }).some((item) => item.title.includes('跨部门'))).toBe(true);
    expect(filterTopics(initialTopics, initialBoards, { kind: 'forum', author: '谢琳' }).some((item) => item.title.includes('会议室预约'))).toBe(true);
    expect(topicAssigneeDepartmentText('李晴、何安')).toBe('创新运营组、人力资源部');
    expect(topicAssigneeDepartmentText(undefined)).toBe('—');
    expect(topicAssigneeHasReplied(initialTopics[0]!)).toBe(false);
    expect(topicAssigneeHasReplied(initialTopics[4]!)).toBe(true);
    expect(initialTopics[3]?.replyAssignees).toBe('周敏');
    expect(topicAssigneeHasReplied(initialTopics[3]!)).toBe(false);
  });

  it('pins only the first assignee main comment', () => {
    const topic = initialTopics[3]!;
    const commented = withTopicComment(topic, '我来看看成色。', '周敏', '2026-08-12 13:00');
    expect('error' in commented).toBe(false);
    if ('error' in commented) return;
    expect(commented.comments.at(-1)?.pinned).toBe(true);
    const again = withTopicComment(commented, '再补充一下接口。', '周敏', '2026-08-12 13:02');
    expect('error' in again).toBe(false);
    if ('error' in again) return;
    expect(again.comments.at(-1)?.pinned).toBeFalsy();
    const nested = withTopicReply(topic, 1, '我看过了。', '周敏', '唐宇', '2026-08-12 13:05');
    expect('error' in nested).toBe(false);
    if ('error' in nested) return;
    const parent = nested.comments.find((item) => item.id === 1);
    expect(parent?.pinned).toBeFalsy();
    expect(parent?.replies.at(-1)?.pinned).toBeFalsy();
    const outsider = withTopicComment(topic, '路过问问价。', '方圆', '2026-08-12 13:10');
    expect('error' in outsider).toBe(false);
    if ('error' in outsider) return;
    expect(outsider.comments.at(-1)?.pinned).toBeFalsy();
  });

  it('rejects empty required board fields and duplicate names', () => {
    const draft: ForumBoardDraft = {
      kind: 'forum',
      name: '',
      description: '',
      rules: '',
      visibility: '全员',
      organizations: [],
      managers: [],
      anonymous: false,
    };
    expect(validateBoardDraft(draft).name).toBe('请输入论坛名称');
    expect(duplicateBoardName(initialBoards, '二手论坛')).toBe(true);
    expect(duplicateBoardName(initialBoards, '二手论坛', 1)).toBe(false);
    expect(duplicateMailboxManager(initialBoards, '林知夏')).toBe(true);
    expect(duplicateMailboxManager(initialBoards, '林知夏', 3)).toBe(false);
    expect(duplicateMailboxManager(initialBoards, '不存在的人')).toBe(false);
    const occupied = occupiedMailboxManagerNames(initialBoards);
    expect([...occupied].sort()).toEqual(['何安', '周明远', '林知夏', '赵宁']);
    expect(occupiedMailboxManagerNames(initialBoards, 3).has('林知夏')).toBe(false);
    const marked = withOccupiedMailboxManagers(forumPeoplePickerTree, occupied);
    const find = (nodes: typeof marked, value: string): (typeof marked)[number] | undefined => {
      for (const node of nodes) {
        if (node.value === value) return node;
        if (node.children) {
          const hit = find(node.children, value);
          if (hit) return hit;
        }
      }
      return undefined;
    };
    expect(find(marked, '林知夏')?.disabled).toBe(true);
    expect(find(marked, '林知夏')?.title).toBe('林知夏（已负责其他信箱）');
    expect(find(marked, '王涛')?.disabled).toBeFalsy();
    expect(find(marked, '王涛')?.title).toBe('王涛');
  });

  it('labels pin / shelf and mute status', () => {
    expect(topicManagementLabels({ pinScope: 'board', shelfStatus: 'on' })).toEqual(['置顶']);
    expect(isTopicPinned({ pinScope: 'board' })).toBe(true);
    expect(isTopicPinned({ pinScope: 'global' })).toBe(true);
    expect(isTopicPinned({ pinScope: '' })).toBe(false);
    expect(topicManagementLabels({ pinScope: '', shelfStatus: 'off' })).toEqual(['已下架']);
    expect(topicManagementLabels({ pinScope: '', shelfStatus: 'on' })).toEqual(['普通']);
    expect(muteStatusLabel(initialMutes[0]!)).toBe('生效中');
    expect(muteStatusLabel(initialMutes[1]!)).toBe('已解除');
    expect(initialMutes[0]?.reason).toBe('发布违规广告信息');
    expect(initialMutes[0]?.mutedAt).toBe('2026-08-18 09:30');
    expect(initialMutes[0]?.releasedAt).toBeUndefined();
    expect(initialMutes[1]?.releasedAt).toBe('2026-08-08 10:00');
    expect(validateMuteDraft({ user: '', department: '', reason: '' })).toBe('请选择禁言成员');
    expect(validateMuteDraft({ user: '周敏', department: '市场品牌部', reason: '' })).toBe('请输入禁言原因');
    expect(validateMuteDraft({ user: '周敏', department: '市场品牌部', reason: '广告' })).toBeNull();
    expect(canToggleBoardStatus(initialBoards[0]!)).toBe(true);
  });

  it('counts nested comments and appends admin replies', () => {
    const topic = initialTopics[0]!;
    expect(topic.author).toBe('周敏');
    expect(topic.images.length).toBe(7);
    expect(topicCommentCount(topic.comments)).toBe(14);
    expect(validateForumComment('')).toBe('请输入回复内容');
    const replied = withTopicComment(topic, '园区内自提即可。', '管宁', '2026-08-12 17:00');
    expect('error' in replied).toBe(false);
    if ('error' in replied) return;
    expect(replied.commentCount).toBe(15);
    const nested = withTopicReply(replied, 4, '承重没问题。', '管宁', '唐宇', '2026-08-12 17:10');
    expect('error' in nested).toBe(false);
    if ('error' in nested) return;
    expect(nested.comments.find((item) => item.id === 4)?.replies.at(-1)?.content).toBe('承重没问题。');
    expect(forumCommentReplyAccountOptions()[0]).toEqual({ value: forumAdminSelf, label: '陈产品（个人账号）' });
    expect(forumCommentReplyAccountOptions().map((item) => item.value)).toEqual(['陈产品', '论坛小助手', '官方客服']);
    expect(isForumCommentReplyAccount('论坛小助手')).toBe(true);
    expect(isForumCommentReplyAccount('管宁')).toBe(false);
  });

  it('seeds comment and reply mock images', () => {
    const chair = initialTopics[0]!;
    expect(chair.comments.find((item) => item.id === 1)?.images).toEqual(['/activities/open-day.jpg', '/activities/share.jpg']);
    expect(chair.comments.find((item) => item.id === 1)?.replies.find((item) => item.id === 2)?.images).toEqual(['/activities/onboarding.jpg']);
    expect(chair.comments.find((item) => item.id === 4)?.images).toEqual(['/activities/checkup.jpg']);
    const display = initialTopics[3]!;
    expect(display.comments[0]?.images).toEqual(['/activities/webinar.jpg']);
    expect(display.comments[0]?.replies[0]?.images).toEqual(['/activities/basketball.jpg']);
  });

  it('lists unique actual repliers from chairman replies', () => {
    const cross = initialTopics.find((item) => item.title.includes('跨部门项目职责边界'))!;
    expect(topicActualReplierText(cross)).toBe('周明远');
    const mine = initialTopics.find((item) => item.title.includes('跨部门重点项目协同机制'))!;
    expect(topicActualReplierText(mine)).toBe('—');
  });

  it('appends multiple chairman replies on advice', () => {
    const topic = initialTopics.find((item) => item.title.includes('竞聘信息发布'))!;
    expect(topicChairmanReplies(topic)).toEqual([]);
    const replied = withChairmanReply(topic, '已收到，将统一发布入口和报名周期。', '陈产品', '2026-08-16 10:00');
    expect('error' in replied).toBe(false);
    if ('error' in replied) return;
    expect(replied.chairmanReply).toEqual({
      content: '已收到，将统一发布入口和报名周期。',
      time: '2026-08-16 10:00',
      author: '陈产品',
    });
    const again = withChairmanReply(replied, '再回一次', '陈产品', '2026-08-16 11:00');
    expect('error' in again).toBe(false);
    if ('error' in again) return;
    expect(topicChairmanReplies(again)).toEqual([
      { content: '已收到，将统一发布入口和报名周期。', time: '2026-08-16 10:00', author: '陈产品' },
      { content: '再回一次', time: '2026-08-16 11:00', author: '陈产品' },
    ]);
    expect(again.chairmanReply).toEqual({ content: '再回一次', time: '2026-08-16 11:00', author: '陈产品' });
    expect(withChairmanReply(topic, '  ', '陈产品', '2026-08-16 10:00')).toEqual({ error: '请输入回复内容' });
  });

  it('pins main comments to the top', () => {
    const topic = initialTopics[0]!;
    expect(topic.comments[1]?.id).toBe(4);
    const pinned = withTopicCommentPin(topic, 4, true);
    expect('error' in pinned).toBe(false);
    if ('error' in pinned) return;
    expect(pinned.comments.find((item) => item.id === 4)?.pinned).toBe(true);
    expect(sortPinnedComments(pinned.comments)[0]?.id).toBe(4);
    expect(withTopicCommentPin(topic, 99, true)).toEqual({ error: '评论不存在' });
  });

  it('pages main comments 10 at a time and keeps nested replies', () => {
    const comments = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      author: `作者${i + 1}`,
      content: 'x',
      createdAt: '2026-08-12 15:00',
      replies: [{ id: 100 + i, author: '回', content: 'y', createdAt: '2026-08-12 15:01' }],
    }));
    expect(FORUM_MAIN_COMMENT_PAGE_SIZE).toBe(10);
    expect(pageMainComments(comments, 10)).toHaveLength(10);
    expect(pageMainComments(comments, 10).map((item) => item.author)).toEqual(
      Array.from({ length: 10 }, (_, i) => `作者${i + 1}`),
    );
    expect(pageMainComments(comments, 10)[0]?.replies).toHaveLength(1);
    expect(pageMainComments(comments, 20)).toHaveLength(12);
  });

  it('validates unique tag names and counts topic usage', () => {
    expect(initialForumTags.map((item) => item.name)).toEqual(['闲置转让', '求购', '办公建议', '生活服务', '归档标签', '员工体验', '经营发展', '人才发展', '建言献策']);
    expect(validateForumTagName('', initialForumTags)).toBe('请输入标签名称');
    expect(validateForumTagName('闲置转让', initialForumTags)).toBe('标签名称已存在');
    expect(validateForumTagName('闲置转让', initialForumTags, 1)).toBeNull();
    expect(validateForumTagName('一二三四五六七八九十一二三四五六七八九十一', initialForumTags)).toBe('标签名称不超过 20 个字');
    expect(nextForumTagOrder(tagsByScope(initialForumTags, 'forum'))).toBe(60);
    expect(nextForumTagOrder(tagsByScope(initialForumTags, 'mailbox'))).toBe(50);
    expect(countForumTagUsage('闲置转让', initialTopics)).toBeGreaterThan(0);
    expect(countForumTagUsage('求购', initialTopics)).toBe(0);
    expect(countBoardTagUsage('员工体验', initialBoards)).toBe(1);
    expect(filterForumTags(initialForumTags, { name: '办公', status: '启用' }).map((item) => item.name)).toEqual(['办公建议']);
    const sorted = tagsByScope(initialForumTags, 'forum').sort(compareForumTags);
    expect(sorted[0]?.name).toBe('闲置转让');
  });

  it('keeps header image, icon and board tags on draft roundtrip', () => {
    expect(enabledForumTagNames(initialForumTags)).toEqual(['闲置转让', '求购', '办公建议', '生活服务']);
    expect(enabledForumTagNames(initialForumTags, 'mailbox')).toEqual(['员工体验', '经营发展', '人才发展', '建言献策']);
    expect(initialBoards[0]?.icon).toBe('/forum/secondhand-icon.png');
    const board = boardFromDraft(
      {
        kind: 'forum',
        name: '二手论坛',
        description: '简介',
        rules: '规则',
        visibility: '全员',
        organizations: [],
        managers: ['王涛'],
        anonymous: false,
        headerImage: '/forum/secondhand.jpg',
        icon: '/forum/secondhand-icon.png',
        tags: ['闲置转让', '求购'],
      },
      9,
      '2026-09-16 10:00',
    );
    expect(board.headerImage).toBe('/forum/secondhand.jpg');
    expect(board.icon).toBe('/forum/secondhand-icon.png');
    expect(board.tags).toEqual(['闲置转让', '求购']);
    expect(board.visibility).toBe('全员');
    expect(board.organizations).toBe('全员');
    expect(draftFromBoard(board).visibility).toBe('全员');
    expect(draftFromBoard(board).headerImage).toBe('/forum/secondhand.jpg');
    expect(draftFromBoard(board).icon).toBe('/forum/secondhand-icon.png');
    expect(draftFromBoard(board).tags).toEqual(['闲置转让', '求购']);
  });

  it('keeps mailbox icon on draft roundtrip without header image', () => {
    expect(initialBoards.find((item) => item.kind === 'mailbox')?.icon).toBe('/forum/mailbox-icon.png');
    const board = boardFromDraft(
      {
        kind: 'mailbox',
        name: '建言献策',
        description: '简介',
        rules: '',
        purpose: '关注员工体验',
        visibility: '全员',
        organizations: [],
        managers: ['赵宁'],
        anonymous: true,
        icon: '/forum/mailbox-icon.png',
      },
      10,
      '2026-09-16 14:00',
    );
    expect(board.icon).toBe('/forum/mailbox-icon.png');
    expect(board.headerImage).toBeUndefined();
    expect(draftFromBoard(board).icon).toBe('/forum/mailbox-icon.png');
    expect(board.responseSlaEnabled).toBe(false);
    expect(draftFromBoard(board).responseSlaEnabled).toBe(false);
    expect(board.replier).toBe('');
    expect(draftFromBoard(board).repliers).toEqual([]);
  });

  it('keeps optional mailbox repliers on draft roundtrip', () => {
    const base: ForumBoardDraft = {
      kind: 'mailbox',
      name: '建言献策',
      description: '简介',
      rules: '',
      purpose: '关注员工体验',
      visibility: '全员',
      organizations: [],
      managers: ['林知夏'],
      anonymous: true,
    };
    expect(validateBoardDraft({ ...base, visibility: '按部门', departments: [] }).departments).toBe('请选择部门');
    expect(validateBoardDraft({ ...base, visibility: '自定义人群', customPeople: [] }).customPeople).toBe('请选择人员');
    expect(validateBoardDraft({ ...base, visibility: '导入人群', importFileName: '' }).importFileName).toBe('请导入人群文件');
    expect(validateBoardDraft({ ...base, repliers: [] })).toEqual({});
    expect(validateBoardDraft({ ...base, purpose: '' })).toEqual({});
    const saved = boardFromDraft({ ...base, repliers: ['赵宁', '宋妍'] }, 12, '2026-09-16 15:00');
    expect(saved.replier).toBe('赵宁、宋妍');
    expect(draftFromBoard(saved).repliers).toEqual(['赵宁', '宋妍']);
  });

  it('requires mailbox response sla only when switch is on', () => {
    expect(MAILBOX_RESPONSE_SLA_OPTIONS).toEqual(['24h', '48h', '一周', '不限时']);
    const mailbox = initialBoards.find((item) => item.kind === 'mailbox');
    expect(mailbox?.responseSlaEnabled).toBe(false);
    const base: ForumBoardDraft = {
      kind: 'mailbox',
      name: '建言献策',
      description: '简介',
      rules: '',
      purpose: '关注员工体验',
      visibility: '全员',
      organizations: [],
      managers: ['林知夏'],
      anonymous: true,
    };
    expect(validateBoardDraft({ ...base, responseSlaEnabled: true })).toEqual({ responseSla: '请选择响应时效' });
    expect(validateBoardDraft({ ...base, responseSlaEnabled: true, responseSla: '24h' })).toEqual({});
    const saved = boardFromDraft({ ...base, responseSlaEnabled: true, responseSla: '一周' }, 11, '2026-09-16 14:10');
    expect(saved.responseSlaEnabled).toBe(true);
    expect(saved.responseSla).toBe('一周');
    expect(draftFromBoard(saved).responseSla).toBe('一周');
  });

  it('builds organization tree that can select people', () => {
    const values = flattenForumOrgValues(forumOrgTree);
    expect(forumOrgTree[0]?.value).toBe('全公司');
    expect(values).toContain('管宁');
    expect(values).toContain('人力资源部');
    expect(values).toContain('社区运营');
    const company = forumPeoplePickerTree[0];
    expect(company?.selectable).toBe(false);
    expect(company?.disableCheckbox).toBe(true);
    const person = flattenForumOrgValues(forumPeoplePickerTree).includes('王涛');
    expect(person).toBe(true);
    const walk = (nodes: typeof forumPeoplePickerTree) => {
      for (const node of nodes) {
        if (node.children?.length) {
          expect(node.disableCheckbox).toBe(true);
          expect(node.selectable).toBe(false);
          walk(node.children);
        } else if (FORUM_USER_OPTIONS.some((item) => item.name === node.value)) {
          expect(node.disableCheckbox).toBeFalsy();
          expect(node.selectable).toBe(true);
        }
      }
    };
    walk(forumPeoplePickerTree);
    expect(onlyForumPeople(['王涛', '人力资源部', '全公司', '李晴'])).toEqual(['王涛', '李晴']);
  });
});
