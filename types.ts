
export enum CardType {
  EXPERIENCE = 'EXPERIENCE', // 体验卡
  DIALOGUE = 'DIALOGUE',     // 对话卡
  ITEM = 'ITEM'              // 道具卡
}

export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY'
}

export interface Card {
  id: string;
  name: string;
  description: string;
  moodEffect: number;   // Affects Axis 1 (-100 to 100)
  energyEffect: number; // Affects Axis 2 (-100 to 100)
  type: CardType;
  rarity: Rarity;
  imageKeyword?: string;
  logicId?: string; // For special code handling
}

export interface Character {
    id: string;
    name: string;
    title: string; 
    description: string;
    initialMood: number;
    initialEnergy: number;
    initialPatience: number;
    traits: string[];
    avatarSeed: string; 
    levelRequired: number; // 0 for starter, 1, 2, 3...
}

export interface GameState {
  character: Character; 
  mood: number;       
  energy: number;     
  patience: number;   
  maxPatience: number;
  
  deck: Card[];
  hand: Card[];
  graveyard: Card[];
  
  activeItem: Card | null; 
  itemMagicTrickUsed?: boolean; 
  turtleBreathingTriggerCount: number; // For Turtle Breathing Item limit

  cardsPlayedThisTurn: number;
  maxPlaysThisTurn: number; 
  drawCountNextTurn: number;
  
  // Mechanics
  turnStartMood: number; // To track mood change for Safety Command
  sensitivity: number; 
  dullness: number; 
  deepThoughtActive: boolean; 
  nextTurnDrawBonus: number; 
  lastCardTypePlayedThisTurn: CardType | null; 
  barrierAxis: 'MOOD' | 'ENERGY' | null;
  moodDroppedThisTurn: boolean; 
  
  // New Flags
  superSensitivityActive: boolean; // "Super Sensitivity" card effect
  safetyCommandActive: boolean; // "Safety Command" card effect
  experienceCardsPlayedThisTurn: number; // For Han Yi's trait
  hasPlayedDialogueThisTurn: boolean; // For Super Sensitivity conditional check
  
  // Rou Ge Specific Mechanics
  statModificationCount: number; 
  emotionalResistance: number; 
}

export enum TurnPhase {
  CHARACTER_SELECTION = 'CHARACTER_SELECTION', 
  SETUP_ITEM_SELECTION = 'SETUP_ITEM_SELECTION', 
  PLAYER_TURN = 'PLAYER_TURN', 
  PLAYER_DISCARD_CHOICE = 'PLAYER_DISCARD_CHOICE', 
  ROUND_END_DIALOGUE = 'ROUND_END_DIALOGUE', 
  GAME_OVER_WIN = 'GAME_OVER_WIN', 
  GAME_OVER_LOSS = 'GAME_OVER_LOSS'
}

export interface GameLogEntry {
  id: string;
  message: string;
  type: 'info' | 'positive' | 'negative' | 'system';
}

export interface PendingDecision {
    type: 'CHOOSE_AXIS' | 'NEURAL_ROAM_CHOICE' | 'SELECT_HAND_CARD' | 'SELECT_GRAVEYARD_CARD'; 
    cardName: string;
    roamValue?: number; 
    filterType?: CardType; // For filtering graveyard selection
    onResolve: (result: any) => void;
    contextData?: any; // To pass data between steps
}
