const fallbackIntro =
  '一群有共同兴趣的同事，在这里认识搭子、组织活动、慢慢把爱好做成日常。欢迎新人，节奏自己定。';

const introByCategory: Record<string, string> = {
  sport:
    '挥洒汗水，结识同好。我们提供专业指导与轻松氛围，无论你是健身老手还是零基础新人，都能在这里找到属于自己的节奏。',
  learning:
    '一本书，一群人，慢慢读。我们不打卡、不焦虑，只在文字里相遇，在讨论中碰撞，给思想一个停靠的港湾。',
  career:
    '把同事的职场经验变成你的捷径。每期一个主题：汇报表达、向上沟通、项目复盘，老带新少走弯路。',
  game: '快乐第一，胜负其次。剧本杀、桌游、电竞开黑，午休和下班随时开局，菜也是一种风格。',
  movie: '让眼睛和耳朵去旅行。从周五观影到内部开放麦，这里聚集了公司里所有热爱现场与电影的灵魂。',
  volunteer: '用业余时间做点暖心的事。社区助老、公益义卖，人人可参与，把善意变成可重复的公益日常。',
};

export function generateInterestGroupIntro(categoryKey: string): string {
  return introByCategory[categoryKey] ?? fallbackIntro;
}
