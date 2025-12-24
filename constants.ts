
import { Card, CardType, Rarity, Character } from './types';

export const TARGET_THRESHOLD = 75;

// --- Character Definitions ---

export const JIA_HAO: Character = {
    id: 'jia-hao',
    name: '男高中生家豪',
    title: '迷茫的高中生',
    description: '一名普通的高中生。这是一个入门引导角色。',
    initialMood: 20,
    initialEnergy: -20,
    initialPatience: 7,
    avatarSeed: 'jia-hao-boy',
    traits: [
        '初学者：牌库中只有【体验卡】。'
    ],
    levelRequired: 0
};

export const XIAO_SU: Character = {
    id: 'xiao-su',
    name: '晓苏',
    title: '敏感的青年',
    description: '内心细腻，情绪容易波动。',
    initialMood: -30,
    initialEnergy: -60,
    initialPatience: 7,
    avatarSeed: 'xiao-su-girl',
    traits: [
        '情绪记忆：“敏感”层数不会在回合结束时清空。',
        '进阶：牌库中加入【对话卡】和【道具卡】。'
    ],
    levelRequired: 1
};

export const HAN_YI: Character = {
    id: 'han-yi',
    name: '韩伊',
    title: '压抑的学生',
    description: '需要强烈刺激才能感受到情绪的变化。',
    initialMood: -70,
    initialEnergy: -20,
    initialPatience: 6,
    avatarSeed: 'han-yi-student',
    traits: [
        '阈值：每回合第一张【体验卡】无效。',
        '爆发：从第二张【体验卡】开始，效果翻倍。'
    ],
    levelRequired: 2
};

export const ROU_GE: Character = {
    id: 'rou-ge',
    name: '柔歌',
    title: '情感解离者',
    description: '情绪如同死水，任何波澜都会迅速归于平静。',
    initialMood: -40,
    initialEnergy: -40,
    initialPatience: 6,
    avatarSeed: 'rou-ge-artist',
    traits: [
        '情感阻尼：每回合第二次情绪变动起，数值逐渐向0靠拢(阻尼+5)。',
        '重置：回合结束时阻尼清零。'
    ],
    levelRequired: 3
};

export const CHARACTERS = [JIA_HAO, XIAO_SU, HAN_YI, ROU_GE];

// Logic Tables
export const getDrawCount = (mood: number): number => {
  const abs = Math.abs(mood);
  if (abs < 25) return 5;
  if (abs < 50) return 4;
  if (abs < 75) return 3;
  return 2;
};

export const getMaxPlays = (energy: number): number => {
  const abs = Math.abs(energy);
  if (abs < 25) return 2;
  if (abs < 50) return 3;
  if (abs < 75) return 4;
  return 5;
};

// --- CARD DATA ---

const createCard = (id: string, name: string, type: CardType, desc: string, m: number, e: number, rarity: Rarity, kw: string, logicId?: string) => ({
  id, name, type, description: desc, moodEffect: m, energyEffect: e, rarity, imageKeyword: kw, logicId
});

// 1. Items 
export const ITEM_CARDS: Card[] = [
  createCard('i-14', '情绪量化', CardType.ITEM, '当能量轴减少 或 心境轴增加 数值≥10时，摸1张牌。', 0, 0, Rarity.RARE, 'chart'),
  createCard('i-16', '黑色相簿', CardType.ITEM, '回合开始时，若你手牌数为x且x>3，则令角色陷入x-3层“敏感”。', 0, 0, Rarity.RARE, 'album'),
  createCard('i-19', '龟息疗法', CardType.ITEM, '若回合内出牌≤1，回合结束时耐心+1并抽1张牌(下回合)。每局限3次。', 0, 0, Rarity.RARE, 'turtle'),
];

export const ITEM_POOL = ITEM_CARDS;

// 2. Dialogue Cards
const DIALOGUE_DEFS: { card: Card, qty: number }[] = [
  { card: createCard('d-1', '启动', CardType.DIALOGUE, '抽2张牌。若本回合未出过其他牌，不计入出牌次数。', 0, 0, Rarity.RARE, 'start', 'logic-start'), qty: 1 },
  { card: createCard('d-2', '共鸣', CardType.DIALOGUE, '心境-1，令角色陷入2层“敏感”', -1, 0, Rarity.COMMON, 'resonance', 'logic-resonance'), qty: 1 },
  { card: createCard('d-3', '神经漫游', CardType.DIALOGUE, '弃掉一半手牌(向下取整)。每弃1张使一条轴变化10 (可选正负)。', 0, 0, Rarity.LEGENDARY, 'neuron', 'logic-roam'), qty: 1 },
  { card: createCard('d-4', '梦境之末', CardType.DIALOGUE, '摸2张牌，选择一个轴数值变为66%(向下取整)', 0, 0, Rarity.RARE, 'dream', 'logic-dream'), qty: 1 },
  { card: createCard('d-5', '集中', CardType.DIALOGUE, '弃1张牌，将本回合剩余出牌数转换为下回合额外抽牌数', 0, 0, Rarity.COMMON, 'focus', 'logic-focus'), qty: 1 },
  { card: createCard('d-6', '深度思考', CardType.DIALOGUE, '能量-10。本回合每打出一张体验卡，额外获得1出牌数。', 0, -10, Rarity.RARE, 'think', 'logic-think'), qty: 1 },
  { card: createCard('d-7', '屏障', CardType.DIALOGUE, '指定一条情绪轴，该轴本回合数值不会再降低。', 0, 0, Rarity.RARE, 'shield', 'logic-barrier'), qty: 1 },
  { card: createCard('d-8', '重估', CardType.DIALOGUE, '洗一张手牌回牌堆，从弃牌堆选一张体验卡入手。', 0, 0, Rarity.RARE, 'recycle', 'logic-reevaluate'), qty: 1 },
  { card: createCard('d-9', '重启', CardType.DIALOGUE, '弃置所有x张手牌，摸x+1张。若本回合情绪降低过，不消耗次数。', 0, 0, Rarity.LEGENDARY, 'restart', 'logic-restart'), qty: 1 },
  { card: createCard('d-10', '超级敏感', CardType.DIALOGUE, '心境-10。本回合敏感效果改为“翻倍”。若已打出对话卡，额外+1层敏感。', -10, 0, Rarity.RARE, 'sensitive', 'logic-super-sense'), qty: 1 },
  { card: createCard('d-11', '安全指令', CardType.DIALOGUE, '回合结束时，若本回合心境轴数值变动少于20，则使耐心度+1。', 0, 0, Rarity.RARE, 'safety', 'logic-safety'), qty: 1 },
];

// 3. Experience Cards
const EXPERIENCE_DEFS: { card: Card, qty: number }[] = [
  { card: createCard('e-1', '幸福理论', CardType.EXPERIENCE, '心境轴+10', 10, 0, Rarity.COMMON, 'theory'), qty: 3 },
  { card: createCard('e-2', '希望之花', CardType.EXPERIENCE, '能量轴+10', 0, 10, Rarity.COMMON, 'flower'), qty: 3 },
  { card: createCard('e-3', '十恋百花', CardType.EXPERIENCE, '心境轴+5，能量轴+5', 5, 5, Rarity.COMMON, 'blossom'), qty: 3 },
  { card: createCard('e-4', '空想玫瑰', CardType.EXPERIENCE, '心境轴+15，能量轴-5', 15, -5, Rarity.RARE, 'rose'), qty: 2 },
  { card: createCard('e-5', '赛博精神', CardType.EXPERIENCE, '心境轴-5，能量轴+15', -5, 15, Rarity.RARE, 'cyber'), qty: 2 },
];

export const FULL_DECK: Card[] = [];

// Helper to hydrate cards
const hydrate = (defs: { card: Card, qty: number }[]) => {
    const list: Card[] = [];
    defs.forEach(def => {
        for (let i = 0; i < def.qty; i++) {
            list.push({ ...def.card, id: `${def.card.id}-${i}` });
        }
    });
    return list;
};

const EXP_POOL = hydrate(EXPERIENCE_DEFS);
const DIALOGUE_POOL = hydrate(DIALOGUE_DEFS);

[...EXP_POOL, ...DIALOGUE_POOL].forEach(c => FULL_DECK.push(c));
FULL_DECK.sort(() => Math.random() - 0.5);

// New Helper: Get Deck based on Character Restrictions
export const getDeckForCharacter = (charId: string): Card[] => {
    let deck: Card[] = [];
    
    if (charId === 'jia-hao') {
        // Only Experience
        deck = [...EXP_POOL];
    } else {
        // Xiao Su, Han Yi, Rou Ge: All cards
        deck = [...EXP_POOL, ...DIALOGUE_POOL];
    }
    
    return deck.sort(() => Math.random() - 0.5);
};

export const STARTER_DECK = FULL_DECK;
