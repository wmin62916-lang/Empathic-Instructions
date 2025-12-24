
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card as CardType, TurnPhase, GameState, GameLogEntry, CardType as CType, Character, PendingDecision } from './types';
import { TARGET_THRESHOLD, ITEM_POOL, getDeckForCharacter, getDrawCount, getMaxPlays, CHARACTERS, JIA_HAO } from './constants';
import { Card } from './components/Card';
import { GameLog } from './components/GameLog';
import { generateCardFromPrompt, getStrategicTip, getRoundEndDialogue } from './services/geminiService';
import { Sparkles, BrainCircuit, PlayCircle, RefreshCw, Activity, Heart, Clock, User, Box, Layers, Archive, X, AlertCircle, ToggleLeft, ToggleRight, Zap, Users, ArrowRight, Bot, Trash2, Shield, Repeat, RefreshCcw, Menu, MessageSquare, Hammer, Lock, BookOpen, Info, MoveRight } from 'lucide-react';

const createInitialState = (character: Character): GameState => ({
  character,
  mood: character.initialMood,
  energy: character.initialEnergy,
  patience: character.initialPatience,
  maxPatience: character.initialPatience,
  deck: getDeckForCharacter(character.id),
  hand: [],
  graveyard: [],
  activeItem: null,
  cardsPlayedThisTurn: 0,
  maxPlaysThisTurn: getMaxPlays(character.initialEnergy),
  drawCountNextTurn: getDrawCount(character.initialMood),
  sensitivity: 0,
  dullness: 0, 
  deepThoughtActive: false,
  nextTurnDrawBonus: 0,
  itemMagicTrickUsed: false,
  turtleBreathingTriggerCount: 0,
  lastCardTypePlayedThisTurn: null,
  statModificationCount: 0,
  emotionalResistance: 0,
  barrierAxis: null,
  moodDroppedThisTurn: false,
  superSensitivityActive: false,
  safetyCommandActive: false,
  experienceCardsPlayedThisTurn: 0,
  hasPlayedDialogueThisTurn: false,
  turnStartMood: character.initialMood
});

// Helper component for Pile Modal
const PileModal: React.FC<{ title: string; cards: CardType[]; onClose: () => void }> = ({ title, cards, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800 rounded-t-xl">
        <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
          <Layers size={20} /> {title} ({cards.length})
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-2">
          {cards.map((card, i) => (
            <div key={i} className="scale-90 origin-top-left"><Card card={card} size="sm" /></div>
          ))}
          {cards.length === 0 && <div className="col-span-full text-center text-slate-500 py-10">空空如也</div>}
        </div>
      </div>
    </div>
  </div>
);

// Helper for Trait Modal
const TraitModal: React.FC<{ character: Character; onClose: () => void }> = ({ character, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
         <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
         <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-500">
                  <img src={`https://picsum.photos/seed/${character.avatarSeed}/100/100`} />
             </div>
             <div>
                 <h3 className="text-xl font-bold text-white">{character.name}</h3>
                 <div className="text-xs text-slate-400">{character.title}</div>
             </div>
         </div>
         <div className="space-y-3">
             <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">角色特性</div>
             {character.traits.map((trait, i) => (
                 <div key={i} className="bg-slate-800 p-3 rounded-lg text-sm text-slate-300 border-l-2 border-purple-500">
                     {trait}
                 </div>
             ))}
         </div>
         <div className="mt-6 text-center">
             <button onClick={onClose} className="bg-slate-700 text-white px-6 py-2 rounded-full text-sm">关闭</button>
         </div>
      </div>
    </div>
);

// Helper for Full Screen Modal (Log / Tools)
const DrawerModal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity" onClick={onClose}>
        <div className="w-full sm:w-80 bg-slate-900 h-full border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center p-4 border-b border-slate-800">
                <h3 className="font-bold text-slate-200">{title}</h3>
                <button onClick={onClose}><X className="text-slate-400" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4">
                 {children}
             </div>
        </div>
    </div>
);

export default function App() {
  const [phase, setPhase] = useState<TurnPhase>(TurnPhase.CHARACTER_SELECTION);
  const [game, setGame] = useState<GameState>(createInitialState(JIA_HAO));
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(0); 
  
  const [viewingPile, setViewingPile] = useState<'deck' | 'graveyard' | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<'log' | 'tools' | null>(null);
  const [viewingTraits, setViewingTraits] = useState(false);
  
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  const [offeredItems, setOfferedItems] = useState<CardType[]>([]);
  const [forgePrompt, setForgePrompt] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  // --- UI PREVIEW STATE ---
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<{mood: number, energy: number, moodDelta: number, energyDelta: number} | null>(null);

  const addLog = (message: string, type: GameLogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), message, type }]);
  };

  const selectCharacter = (char: Character) => {
    setGame(createInitialState(char));
    setLogs([]); 
    addLog(`载入客人数据: ${char.name}`, "system");

    // Level 0 (Jiahao) skips items. Level 1+ gets items.
    if (char.levelRequired >= 1) {
        const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5);
        setOfferedItems(shuffled.slice(0, 3));
        addLog("请阅读客人档案并选择核心策略。", "system");
        setPhase(TurnPhase.SETUP_ITEM_SELECTION);
    } else {
        addLog("此难度无法使用策略道具。", "system");
        startRound(true);
    }
  };

  const selectItem = (item: CardType) => {
    setGame(prev => ({ ...prev, activeItem: item }));
    addLog(`已激活策略: ${item.name}`, "system");
    startRound(true);
  };

  // --- CORE CALCULATION ENGINE (Used for both Play and Preview) ---
  const calculateStatChanges = (
      baseState: GameState, 
      baseMoodEffect: number, 
      baseEnergyEffect: number, 
      isPreview: boolean = false
  ) => {
    // Clone relevant parts of state to avoid mutation during preview
    let mDelta = baseMoodEffect;
    let eDelta = baseEnergyEffect;
    let sensitivity = baseState.sensitivity;
    let dullness = baseState.dullness;
    
    // --- BARRIER ---
    if (baseState.barrierAxis === 'MOOD' && mDelta < 0) mDelta = 0;
    if (baseState.barrierAxis === 'ENERGY' && eDelta < 0) eDelta = 0;

    // --- SENSITIVITY vs DULLNESS ---
    if (sensitivity > 0 && dullness > 0) {
        const cancel = Math.min(sensitivity, dullness);
        sensitivity -= cancel;
        dullness -= cancel;
    }

    // --- AMPLIFIERS ---
    if (mDelta !== 0 || eDelta !== 0) {
        if (sensitivity > 0) {
            const mult = baseState.superSensitivityActive ? 2.0 : 1.5;
            mDelta = Math.round(mDelta * mult);
            eDelta = Math.round(eDelta * mult);
        } else if (dullness > 0) {
            mDelta = Math.round(mDelta * 0.5);
            eDelta = Math.round(eDelta * 0.5);
        }
    }

    // --- HAN YI TRAIT ---
    // Note: For preview, we assume the card BEING hovered is the NEXT card.
    // So if it's an Experience card, we check what index it would be.
    // Real logic handles this in `playCard` before calling modify, but here we estimate.
    
    // --- PASSIVE ITEMS (Sheep, etc) ---
    // Item logic is complex to preview perfectly without full simulation, 
    // but we can approximate the direct effects.
    
    return { mDelta, eDelta };
  };

  const modifyStats = (currentGameState: GameState, moodDelta: number, energyDelta: number, isPrimaryAction: boolean = true): Partial<GameState> => {
    const { mDelta, eDelta } = calculateStatChanges(currentGameState, moodDelta, energyDelta);
    
    let newSensitivity = currentGameState.sensitivity;
    let newDullness = currentGameState.dullness;
    let newModCount = currentGameState.statModificationCount;
    let newMoodDropped = currentGameState.moodDroppedThisTurn;
    let sensitivityTriggered = false;
    let dullnessTriggered = false;

    // Apply consumption of stacks (Recalculate logic to update state flags)
    // This is a bit repetitive with calculateStatChanges but necessary for State Updates vs Pure Calc
    if (currentGameState.barrierAxis === 'MOOD' && moodDelta < 0 && !isPrimaryAction) { /* Log handled in calc? No, logs here */ }
    
    // Re-run the cancellation/consumption logic to update counters
    let tempSens = newSensitivity;
    let tempDull = newDullness;
    if (tempSens > 0 && tempDull > 0) {
        const cancel = Math.min(tempSens, tempDull);
        newSensitivity -= cancel;
        newDullness -= cancel;
        if(isPrimaryAction) addLog(`敏感与迟钝相互抵消 (${cancel}层)`, "system");
    }
    
    if ((moodDelta !== 0 || energyDelta !== 0)) {
         if (newSensitivity > 0) {
             newSensitivity -= 1;
             sensitivityTriggered = true;
         } else if (newDullness > 0) {
             newDullness -= 1;
             dullnessTriggered = true;
         }
    }

    if (isPrimaryAction && (mDelta !== 0 || eDelta !== 0)) newModCount++;
    if (mDelta < 0) newMoodDropped = true;

    const oldMood = currentGameState.mood;
    const oldEnergy = currentGameState.energy;
    
    let newMood = Math.min(100, Math.max(-100, oldMood + mDelta));
    let newEnergy = Math.min(100, Math.max(-100, oldEnergy + eDelta));

    // Item 13: Electronic Sheep
    let sheepExtraMood = 0;
    let sheepExtraEnergy = 0;
    if (currentGameState.activeItem?.id === 'i-13') {
        const moodDrop = oldMood - newMood;
        const energyDrop = oldEnergy - newEnergy;
        if (moodDrop > 0) sheepExtraEnergy += moodDrop;
        if (energyDrop > 0) sheepExtraMood += energyDrop; 
        if ((moodDrop > 0 || energyDrop > 0) && isPrimaryAction) addLog(`触发【电子羊】：转化流失数值`, "system");
    }

    // Item 14: Emotion Quant
    let quantDraw = 0;
    if (currentGameState.activeItem?.id === 'i-14') {
        const energyDropped = (oldEnergy - newEnergy) >= 10;
        const moodIncreased = (newMood - oldMood) >= 10;
        if (energyDropped || moodIncreased) quantDraw = 1;
    }

    newMood = Math.min(100, Math.max(-100, newMood + sheepExtraMood));
    newEnergy = Math.min(100, Math.max(-100, newEnergy + sheepExtraEnergy));

    // Handle extra draws
    let newHand = [...currentGameState.hand];
    let newDeck = [...currentGameState.deck];
    let newGraveyard = [...currentGameState.graveyard];
    
    if (quantDraw > 0) {
        for (let i=0; i<quantDraw; i++) {
             if (newDeck.length === 0 && newGraveyard.length > 0) {
                 newDeck = [...newGraveyard.sort(() => Math.random() - 0.5)];
                 newGraveyard = [];
             }
             if (newDeck.length > 0) newHand.push(newDeck.shift()!);
        }
        if(isPrimaryAction) addLog("触发【情绪量化】：抽1张牌", "positive");
    }
    
    if (sensitivityTriggered && isPrimaryAction) {
        const label = currentGameState.superSensitivityActive ? "双倍效果" : "效果提升50%";
        addLog(`触发【敏感】：${label}`, "negative");
    }
    if (dullnessTriggered && isPrimaryAction) {
        addLog("触发【迟钝】：效果减少50%", "negative");
    }

    return {
        mood: newMood,
        energy: newEnergy,
        hand: newHand,
        deck: newDeck,
        graveyard: newGraveyard,
        sensitivity: newSensitivity,
        dullness: newDullness,
        statModificationCount: newModCount,
        moodDroppedThisTurn: newMoodDropped
    };
  };

  const startRound = (isFirstRound = false) => {
    setPhase(TurnPhase.PLAYER_TURN);
    
    setGame(prev => {
        let drawBase = isFirstRound ? 5 : getDrawCount(prev.mood); 
        let maxPlays = getMaxPlays(prev.energy);

        const totalDraw = drawBase + prev.nextTurnDrawBonus;
        if (prev.nextTurnDrawBonus > 0) addLog(`触发【集中/龟息】：额外抽 ${prev.nextTurnDrawBonus} 张牌`, "positive");

        const newDeck = [...prev.deck];
        const newGraveyard = [...prev.graveyard];
        const newHand: CardType[] = isFirstRound ? [] : [...prev.hand];
        
        if (newHand.length > 0) {
            newHand.forEach(c => addLog(`继承保留卡牌: [${c.name}]`, "info"));
        }

        for (let i = 0; i < totalDraw; i++) {
            if (newDeck.length === 0) {
                if (newGraveyard.length === 0) break;
                newDeck.push(...newGraveyard.sort(() => Math.random() - 0.5));
                newGraveyard.length = 0;
            }
            newHand.push(newDeck.shift()!);
        }

        let newSensitivity = prev.character.id === 'xiao-su' ? prev.sensitivity : 0;
        
        if (prev.activeItem?.id === 'i-16' && newHand.length > 3) {
             const layers = newHand.length - 3;
             newSensitivity += layers;
             addLog(`触发【黑色相簿】：陷入${layers}层“敏感”`, "negative");
        }
        
        const turnNum = prev.maxPatience - prev.patience + 1;

        return {
            ...prev,
            deck: newDeck,
            graveyard: newGraveyard,
            hand: newHand,
            maxPlaysThisTurn: maxPlays,
            cardsPlayedThisTurn: 0,
            drawCountNextTurn: drawBase,
            nextTurnDrawBonus: 0,
            sensitivity: newSensitivity, 
            dullness: 0,
            deepThoughtActive: false, 
            lastCardTypePlayedThisTurn: null,
            statModificationCount: 0, 
            emotionalResistance: 0,
            barrierAxis: null,
            moodDroppedThisTurn: false,
            superSensitivityActive: false,
            safetyCommandActive: false,
            experienceCardsPlayedThisTurn: 0,
            hasPlayedDialogueThisTurn: false,
            turnStartMood: prev.mood
        };
    });
    addLog(`--- 回合开始 ---`, "system");
  };

  const playCard = (card: CardType, index: number) => {
    if (game.cardsPlayedThisTurn >= game.maxPlaysThisTurn) {
        addLog("精力不足，本回合无法继续行动。", "negative");
        return;
    }

    if (card.logicId === 'logic-dream' || card.logicId === 'logic-barrier') {
        setPendingDecision({
            type: 'CHOOSE_AXIS',
            cardName: card.name,
            onResolve: (axis) => executeCardEffect(card, index, axis)
        });
        return;
    }

    if (card.logicId === 'logic-roam') {
        const discardableCount = game.hand.length - 1;
        const x = Math.floor(discardableCount / 2);
        setPendingDecision({
            type: 'NEURAL_ROAM_CHOICE',
            cardName: card.name,
            roamValue: x,
            onResolve: (result) => executeCardEffect(card, index, result) 
        });
        return;
    }

    if (card.logicId === 'logic-reevaluate') {
        setPendingDecision({
            type: 'SELECT_HAND_CARD',
            cardName: card.name,
            onResolve: (selectedCardIndex) => {
                const targetCard = game.hand[selectedCardIndex];
                executeCardEffect(card, index, { step: 'SHUFFLE_HAND', targetCardId: targetCard.id });
            }
        });
        return;
    }

    executeCardEffect(card, index, null);
  };

  const executeCardEffect = (card: CardType, index: number, choice: any) => {
    setPendingDecision(null);
    setHoveredCardIndex(null); // Clear preview

    setGame(prev => {
        // --- LOGIC: Re-evaluate Multi-Step ---
        if (card.logicId === 'logic-reevaluate' && choice && choice.step === 'SHUFFLE_HAND') {
            const expCardsInGrave = prev.graveyard.filter(c => c.type === CType.EXPERIENCE);
            if (expCardsInGrave.length === 0) {
                addLog("弃牌堆中没有体验卡，效果中止。", "negative");
            } else {
                setTimeout(() => {
                    setPendingDecision({
                        type: 'SELECT_GRAVEYARD_CARD',
                        cardName: card.name,
                        filterType: CType.EXPERIENCE,
                        contextData: { targetCardId: choice.targetCardId }, 
                        onResolve: (selectedCard) => {
                             executeCardEffect(card, index, { step: 'FETCH_GRAVE', targetCardId: choice.targetCardId, selectedCard: selectedCard });
                        }
                    });
                }, 0);
                return prev; 
            }
        }

        let newHand = [...prev.hand];
        let newGraveyard = [...prev.graveyard];
        let newDeck = [...prev.deck];

        // Safe Removal by ID
        const playedCardIndex = newHand.findIndex(c => c.id === card.id);
        if (playedCardIndex === -1 && card.logicId !== 'logic-reevaluate' && card.logicId !== 'logic-restart') return prev;

        let updates: Partial<GameState> = {
            cardsPlayedThisTurn: prev.cardsPlayedThisTurn + 1,
            lastCardTypePlayedThisTurn: card.type
        };

        if (prev.deepThoughtActive && card.type === CType.EXPERIENCE) {
            updates.maxPlaysThisTurn = prev.maxPlaysThisTurn + 1;
            addLog("【深度思考】生效：获得额外行动力", "positive");
        }

        // --- SPECIFIC CARD LOGIC (Mutations before calculation) ---
        if (card.logicId === 'logic-restart') {
            const otherCards = newHand.filter(c => c.id !== card.id);
            const x = otherCards.length;
            newGraveyard.push(...otherCards);
            newGraveyard.push(card); 
            newHand = [];
            
            const drawCount = x + 1;
            for(let i=0; i<drawCount; i++) {
                if(newDeck.length === 0 && newGraveyard.length > 0) {
                     newDeck = [...newGraveyard.sort(() => Math.random() - 0.5)];
                     newGraveyard = [];
                }
                if(newDeck.length > 0) newHand.push(newDeck.shift()!);
            }
            updates.hand = newHand;
            updates.deck = newDeck;
            updates.graveyard = newGraveyard;
        } else if (card.logicId === 'logic-reevaluate' && choice && choice.step === 'FETCH_GRAVE') {
             if (playedCardIndex !== -1) {
                newHand.splice(playedCardIndex, 1);
                newGraveyard.push(card);
             }
             const targetIdx = newHand.findIndex(c => c.id === choice.targetCardId);
             if (targetIdx !== -1) {
                 const cardToShuffle = newHand[targetIdx];
                 newHand.splice(targetIdx, 1);
                 newDeck.push(cardToShuffle);
                 newDeck.sort(() => Math.random() - 0.5); 
                 addLog(`重估：洗回 [${cardToShuffle.name}]`, "info");
             }
             const targetGraveId = choice.selectedCard.id;
             const graveIdx = newGraveyard.findIndex(c => c.id === targetGraveId);
             if (graveIdx !== -1) {
                 newGraveyard.splice(graveIdx, 1);
                 newHand.push(choice.selectedCard);
                 addLog(`重估：获得 [${choice.selectedCard.name}]`, "positive");
             }
             updates.hand = newHand;
             updates.deck = newDeck;
             updates.graveyard = newGraveyard;
        } else {
            if (playedCardIndex !== -1) {
                newHand.splice(playedCardIndex, 1);
                newGraveyard.push(card);
            }
            updates.hand = newHand;
            updates.graveyard = newGraveyard;
        }

        // --- EFFECT CALCULATION ---
        let mEffect = card.moodEffect;
        let eEffect = card.energyEffect;
        let logMsg = `使用了 [${card.name}]`;
        let addedSensitivity = 0; 

        if (card.logicId === 'logic-start') { 
            let draw = 2; 
            if (prev.cardsPlayedThisTurn === 0) {
                updates.cardsPlayedThisTurn = 0; 
                logMsg += " -> 首发不消耗行动力";
            }
            for(let i=0; i<draw; i++) {
                if(newDeck.length === 0 && newGraveyard.length > 0) {
                     newDeck = [...newGraveyard.sort(() => Math.random() - 0.5)];
                     newGraveyard = [];
                }
                if(newDeck.length > 0) newHand.push(newDeck.shift()!);
            }
        } 
        else if (card.logicId === 'logic-roam') { 
             const x = choice.x || 0;
             const amount = 10 * x * choice.sign;
             for(let i=0; i<x; i++) {
                if(newHand.length > 0) {
                    const r = Math.floor(Math.random() * newHand.length);
                    newGraveyard.push(newHand.splice(r, 1)[0]);
                }
             }
             if (choice.axis === 'MOOD') mEffect = amount;
             else eEffect = amount;
             logMsg += ` -> 弃${x}张, ${choice.axis === 'MOOD' ? '心境' : '能量'} ${amount > 0 ? '+' : ''}${amount}`;
        }
        else if (card.logicId === 'logic-dream') { 
             for(let i=0; i<2; i++) {
                if(newDeck.length === 0 && newGraveyard.length > 0) {
                     newDeck = [...newGraveyard.sort(() => Math.random() - 0.5)];
                     newGraveyard = [];
                }
                if(newDeck.length > 0) newHand.push(newDeck.shift()!);
            }
            if (choice === 'MOOD') mEffect = Math.floor(prev.mood * 0.66) - prev.mood;
            else eEffect = Math.floor(prev.energy * 0.66) - prev.energy;
            logMsg += ` -> ${choice === 'MOOD' ? '心境' : '能量'} x66%`;
        }
        else if (card.logicId === 'logic-focus') { 
             if(newHand.length > 0) {
                const r = Math.floor(Math.random() * newHand.length);
                newGraveyard.push(newHand.splice(r, 1)[0]);
             }
             const remaining = prev.maxPlaysThisTurn - (prev.cardsPlayedThisTurn + 1);
             updates.nextTurnDrawBonus = (prev.nextTurnDrawBonus || 0) + Math.max(0, remaining);
             updates.cardsPlayedThisTurn = prev.maxPlaysThisTurn;
             logMsg += ` -> 转换行动力`;
        }
        else if (card.logicId === 'logic-think') { 
            eEffect = -10;
            updates.deepThoughtActive = true;
            logMsg += ` -> 开启深度思考`;
        }
        else if (card.logicId === 'logic-barrier') {
            updates.barrierAxis = choice; 
            logMsg += ` -> ${choice === 'MOOD' ? '心境' : '能量'}屏障开启`;
        }
        else if (card.logicId === 'logic-restart') {
            logMsg += ` -> 弃手牌摸+1`;
            if (prev.moodDroppedThisTurn) {
                updates.cardsPlayedThisTurn = prev.cardsPlayedThisTurn; 
                logMsg += " (情绪曾降低，返还行动力)";
            }
        }
        else if (card.logicId === 'logic-resonance') { 
            addedSensitivity = 2; 
            logMsg += ` -> 敏感度+2`;
        }
        else if (card.logicId === 'logic-super-sense') {
            updates.superSensitivityActive = true;
            if (prev.hasPlayedDialogueThisTurn) {
                addedSensitivity = 1; 
                logMsg += " -> 额外敏感+1";
            }
            logMsg += " -> 超级敏感模式(倍率x2)";
        }
        else if (card.logicId === 'logic-safety') {
            updates.safetyCommandActive = true;
            // Removed immediate patience gain for conditional gain at end of turn
            logMsg += " -> 安全模式(结算判定)";
        }

        // Han Yi Logic
        if (prev.character.id === 'han-yi' && card.type === CType.EXPERIENCE) {
            const count = prev.experienceCardsPlayedThisTurn + 1;
            updates.experienceCardsPlayedThisTurn = count;
            if (count === 1) {
                mEffect = 0; eEffect = 0; logMsg += ` (阈值：无效)`;
            } else {
                mEffect *= 2; eEffect *= 2; logMsg += ` (爆发：效果翻倍)`;
            }
        }

        if (card.type === CType.DIALOGUE) updates.hasPlayedDialogueThisTurn = true;

        // CRITICAL FIX: Explicitly sync deck/graveyard/hand
        updates.hand = newHand;
        updates.deck = newDeck;
        updates.graveyard = newGraveyard;

        let currentState = { ...prev, ...updates };
        const stateForCalc = { ...prev, ...updates };
        stateForCalc.sensitivity = prev.sensitivity; // Use OLD sensitivity for calc

        const step1 = modifyStats(stateForCalc, mEffect, eEffect, true); 
        currentState = { ...currentState, ...step1 };
        
        if (addedSensitivity > 0) currentState.sensitivity = (currentState.sensitivity || 0) + addedSensitivity;
        
        addLog(logMsg, "positive");

        // ROU GE TRAIT
        if (currentState.character.id === 'rou-ge') {
            const currentCount = currentState.statModificationCount;
            if (currentCount >= 2) {
                const dampingAmount = (currentCount - 1) * 5; 
                const curM = currentState.mood;
                const curE = currentState.energy;
                const dampMood = curM > 0 ? Math.max(0, curM - dampingAmount) : Math.min(0, curM + dampingAmount);
                const dampEnergy = curE > 0 ? Math.max(0, curE - dampingAmount) : Math.min(0, curE + dampingAmount);
                
                if (dampMood !== curM || dampEnergy !== curE) {
                     const step2 = modifyStats(currentState, dampMood - curM, dampEnergy - curE, false);
                     currentState = { ...currentState, ...step2 };
                     addLog(`情感阻尼：数值回落 (阻尼 ${dampingAmount})`, "negative");
                }
            }
        }

        return currentState;
    });
  };

  const activateMagicTrick = () => {
      if (game.itemMagicTrickUsed) return;
      setGame(prev => ({
          ...prev,
          mood: prev.energy,
          energy: prev.mood,
          itemMagicTrickUsed: true
      }));
      addLog("使用了【魔术技巧】：情绪轴互换！", "system");
  };
  
  const handleEndTurnClick = () => {
      if (game.hand.length > 0) {
          setPhase(TurnPhase.PLAYER_DISCARD_CHOICE);
          addLog("回合结束：请选择 1 张手牌保留。", "system");
      } else {
          endRound([]);
      }
  };

  const keepCardAndEndRound = (keptCardIndex: number) => {
      const card = game.hand[keptCardIndex];
      const discarded = game.hand.filter((_, i) => i !== keptCardIndex);
      setGame(prev => ({ ...prev, hand: [card], graveyard: [...prev.graveyard, ...discarded] }));
      addLog(`已保留: [${card.name}]`, "info");
      endRound(discarded);
  };

  const discardAllAndEndRound = () => {
      const discarded = [...game.hand];
      setGame(prev => ({ ...prev, hand: [], graveyard: [...prev.graveyard, ...discarded] }));
      endRound(discarded);
  };

  const endRound = async (discardedCards: CardType[]) => {
    setGame(prev => {
        let updates: Partial<GameState> = {};
        if (prev.activeItem?.id === 'i-19' && prev.cardsPlayedThisTurn <= 1 && prev.turtleBreathingTriggerCount < 3) {
            updates.turtleBreathingTriggerCount = prev.turtleBreathingTriggerCount + 1;
            updates.patience = (prev.patience || 0) + 1;
            updates.nextTurnDrawBonus = (prev.nextTurnDrawBonus || 0) + 1;
            addLog("触发【龟息疗法】：耐心+1", "positive");
        }
        
        // Safety Command Check
        if (prev.safetyCommandActive) {
            const moodDiff = Math.abs(prev.mood - prev.turnStartMood);
            if (moodDiff < 20) {
                 updates.patience = (prev.patience || 0) + 1; // Base patience, not including Turtle
                 // If Turtle also added patience, we need to be careful with state updates
                 if (updates.patience && prev.activeItem?.id === 'i-19' && prev.cardsPlayedThisTurn <= 1 && prev.turtleBreathingTriggerCount < 3) {
                     // Turtle already added 1 to prev.patience
                     updates.patience = updates.patience + 1;
                 }
                 addLog("【安全指令】达成 (变动<20)：耐心+1", "positive");
            } else {
                 addLog(`【安全指令】失效 (变动${moodDiff} >= 20)`, "negative");
            }
        }
        
        return { ...prev, ...updates };
    });

    setPhase(TurnPhase.ROUND_END_DIALOGUE);
    const quote = await getRoundEndDialogue(game.mood, game.energy);
    addLog(`客人: "${quote}"`, "info");

    setTimeout(() => {
        setGame(prev => {
            if (prev.mood >= TARGET_THRESHOLD && prev.energy >= TARGET_THRESHOLD) {
                setPhase(TurnPhase.GAME_OVER_WIN);
                addLog("咨询目标达成！", "positive");
                if (prev.character.levelRequired >= unlockedLevel) setUnlockedLevel(prev.character.levelRequired + 1);
                return prev;
            }
            if (prev.patience <= 1) {
                setPhase(TurnPhase.GAME_OVER_LOSS);
                addLog("客人失去了耐心。", "negative");
                return prev;
            }
            return { ...prev, patience: prev.patience - 1 };
        });
        
        setTimeout(() => {
             setPhase(current => {
                 if (current !== TurnPhase.GAME_OVER_WIN && current !== TurnPhase.GAME_OVER_LOSS) {
                     startRound();
                     return TurnPhase.PLAYER_TURN;
                 }
                 return current;
             });
        }, 100);

    }, 2000);
  };

  const handleForge = async () => {
    if (!forgePrompt) return;
    setIsForging(true);
    const newCard = await generateCardFromPrompt(forgePrompt);
    if (newCard) {
        setGame(prev => ({ ...prev, hand: [newCard, ...prev.hand] }));
        addLog(`生成了新方案: ${newCard.name}`, "system");
        setForgePrompt('');
    }
    setIsForging(false);
  };

  const requestTip = async () => {
      const tip = await getStrategicTip(game.mood, game.energy, game.maxPlaysThisTurn - game.cardsPlayedThisTurn);
      setAiTip(tip);
      setTimeout(() => setAiTip(null), 6000);
  };
  
  // --- PREVIEW EFFECT LOGIC ---
  useEffect(() => {
    if (hoveredCardIndex === null || phase !== TurnPhase.PLAYER_TURN) {
        setPrediction(null);
        return;
    }
    const card = game.hand[hoveredCardIndex];
    if (!card) return;

    let baseM = card.moodEffect;
    let baseE = card.energyEffect;

    // Estimate Han Yi
    if (game.character.id === 'han-yi' && card.type === CType.EXPERIENCE) {
        if (game.experienceCardsPlayedThisTurn === 0) {
            baseM = 0; baseE = 0;
        } else {
            baseM *= 2; baseE *= 2;
        }
    }
    
    // Estimate complex cards roughly for preview (Simplification for UI responsiveness)
    if (card.logicId === 'logic-dream') { baseM = 0; baseE = 0; } // Hard to preview choice

    const { mDelta, eDelta } = calculateStatChanges(game, baseM, baseE, true);
    setPrediction({
        mood: Math.min(100, Math.max(-100, game.mood + mDelta)),
        energy: Math.min(100, Math.max(-100, game.energy + eDelta)),
        moodDelta: mDelta,
        energyDelta: eDelta
    });
  }, [hoveredCardIndex, game]);


  // --- RENDER HELPERS ---
  const getCoordinates = (val: number) => ((val + 100) / 200) * 100;

  const renderProgressBar = (value: number, delta: number | undefined, colorBase: string, colorDelta: string, icon: React.ReactNode, label: string) => {
      const percent = Math.max(0, Math.min(100, (value + 100) / 2));
      let deltaPercent = 0;
      let isNegative = false;
      
      if (delta !== undefined && delta !== 0) {
          deltaPercent = (Math.abs(delta) / 200) * 100;
          isNegative = delta < 0;
      }

      return (
         <div className="bg-slate-950 rounded-full h-8 border border-slate-700/50 relative overflow-hidden flex items-center px-2 shadow-inner">
             {/* Base Bar */}
             <div className={`absolute top-0 left-0 h-full ${colorBase} transition-all duration-500`} style={{width: `${percent}%`}}></div>
             
             {/* Preview Add (Green blink) */}
             {delta && delta > 0 && (
                 <div className={`absolute top-0 h-full ${colorDelta} animate-pulse opacity-70`} 
                      style={{left: `${percent}%`, width: `${deltaPercent}%`}}></div>
             )}
             
             {/* Preview Sub (Red blink) - Cuts into base bar */}
             {delta && delta < 0 && (
                 <div className="absolute top-0 h-full bg-red-500/80 animate-pulse z-10" 
                      style={{left: `${percent - deltaPercent}%`, width: `${deltaPercent}%`}}></div>
             )}

             <div className="relative z-20 flex items-center gap-2 w-full">
                 {icon}
                 <span className="text-xs font-bold text-white drop-shadow-md">
                     {value}
                     {delta ? <span className={delta > 0 ? "text-emerald-300 ml-1" : "text-red-300 ml-1"}>({delta > 0 ? '+' : ''}{delta})</span> : ''}
                 </span>
                 <span className="text-[10px] opacity-60 ml-auto">{label}</span>
             </div>
         </div>
      );
  };

  // --- RENDER ---
  if (phase === TurnPhase.CHARACTER_SELECTION) {
    return (
        <div className="h-screen bg-slate-950 flex flex-col p-6 font-sans overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-6 tracking-widest text-center mt-4">咨询室档案</h1>
            <div className="flex flex-col gap-6 w-full max-w-md mx-auto pb-8">
                {CHARACTERS.map(char => (
                    <div key={char.id} onClick={() => selectCharacter(char)}
                        className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden w-full shadow-lg cursor-pointer active:scale-95 transition-transform">
                        <div className="h-40 bg-slate-800 relative overflow-hidden">
                                <img src={`https://picsum.photos/seed/${char.avatarSeed}/400/300`} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 to-transparent p-4">
                                    <h2 className="text-2xl font-bold text-white">{char.name}</h2>
                                    <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">{char.title}</span>
                                </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-slate-400 mb-3">{char.description}</p>
                            <div className="flex justify-between text-xs border-t border-slate-800 pt-2">
                                <span className="text-slate-500">难度: {char.levelRequired + 1}</span>
                                <span className="text-amber-500">{char.initialPatience} 回合</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  if (phase === TurnPhase.SETUP_ITEM_SELECTION) {
      return (
          <div className="h-screen bg-slate-950 flex flex-col p-4 font-sans overflow-y-auto">
              <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full">
                  <h1 className="text-xl font-bold text-center text-slate-200 mt-2">状态评估</h1>
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-600 shrink-0">
                          <img src={`https://picsum.photos/seed/${game.character.avatarSeed}/200/200`} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                          <h2 className="text-xl font-bold text-white">{game.character.name}</h2>
                          <div className="flex gap-4 mt-2">
                              <div className="flex flex-col"><span className="text-xs text-slate-500">心境</span><span className="font-mono text-pink-400 font-bold">{game.character.initialMood}</span></div>
                              <div className="flex flex-col"><span className="text-xs text-slate-500">能量</span><span className="font-mono text-emerald-400 font-bold">{game.character.initialEnergy}</span></div>
                          </div>
                      </div>
                  </div>
                  <div className="flex-1">
                      <h3 className="text-center text-slate-400 text-sm mb-4">选择核心策略</h3>
                      <div className="grid grid-cols-1 gap-3 pb-8">
                          {offeredItems.map(item => (
                              <div key={item.id} onClick={() => selectItem(item)} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex gap-3 cursor-pointer hover:bg-slate-700 active:scale-95 transition-all">
                                  <div className="w-12 h-16 bg-slate-950 rounded shrink-0 flex items-center justify-center"><Box className="text-amber-500" /></div>
                                  <div>
                                      <div className="font-bold text-slate-200">{item.name}</div>
                                      <div className="text-xs text-slate-400 leading-tight mt-1">{item.description}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const isGameOver = phase === TurnPhase.GAME_OVER_WIN || phase === TurnPhase.GAME_OVER_LOSS;

  return (
    <div className="h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col font-sans">
      {/* Modals & Drawers */}
      {viewingPile && <PileModal title={viewingPile === 'deck' ? "抽牌堆" : "弃牌堆"} cards={game[viewingPile]} onClose={() => setViewingPile(null)} />}
      {viewingTraits && <TraitModal character={game.character} onClose={() => setViewingTraits(false)} />}
      {activeDrawer === 'log' && <DrawerModal title="咨询记录" onClose={() => setActiveDrawer(null)}><GameLog logs={logs} /></DrawerModal>}
      {activeDrawer === 'tools' && (
          <DrawerModal title="工具箱" onClose={() => setActiveDrawer(null)}>
              <div className="flex flex-col gap-6">
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="text-xs text-slate-400 mb-1">当前策略</div>
                    <div className="text-amber-400 font-bold flex items-center gap-2"><Box size={16} /> {game.activeItem?.name || "无"}</div>
                    <p className="text-[10px] text-slate-500 mt-1">{game.activeItem?.description}</p>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">生成新方案</label>
                      <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm resize-none h-24" placeholder="输入灵感..." value={forgePrompt} onChange={(e) => setForgePrompt(e.target.value)} />
                      <button disabled={isForging || !forgePrompt} onClick={handleForge} className="w-full bg-purple-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">{isForging ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />} 生成</button>
                  </div>
                  <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 uppercase">AI 督导</label>
                       <button onClick={requestTip} disabled={!!aiTip} className="w-full bg-slate-800 border border-slate-700 text-emerald-400 py-3 rounded-lg flex items-center justify-center gap-2"><BrainCircuit size={16} /> 获取建议</button>
                      {aiTip && <div className="bg-emerald-900/50 p-3 rounded border border-emerald-500/30 text-xs text-emerald-200">{aiTip}</div>}
                  </div>
              </div>
          </DrawerModal>
      )}

      {/* Decision Modal */}
      {pendingDecision && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm text-center">
                  <h3 className="text-xl font-bold mb-4">使用【{pendingDecision.cardName}】</h3>
                  {pendingDecision.type === 'CHOOSE_AXIS' && (
                      <div className="flex flex-col gap-3">
                          <button onClick={() => pendingDecision.onResolve('MOOD')} className="bg-slate-800 border border-pink-500/50 text-pink-300 py-3 rounded-lg font-bold">心境轴</button>
                          <button onClick={() => pendingDecision.onResolve('ENERGY')} className="bg-slate-800 border border-emerald-500/50 text-emerald-300 py-3 rounded-lg font-bold">能量轴</button>
                      </div>
                  )}
                  {pendingDecision.type === 'NEURAL_ROAM_CHOICE' && pendingDecision.roamValue !== undefined && (
                      <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => pendingDecision.onResolve({axis: 'MOOD', sign: 1, x: pendingDecision.roamValue})} className="bg-slate-800 border border-pink-500/50 text-pink-300 p-2 rounded text-sm">心境 +{10 * pendingDecision.roamValue}</button>
                          <button onClick={() => pendingDecision.onResolve({axis: 'MOOD', sign: -1, x: pendingDecision.roamValue})} className="bg-slate-800 border border-pink-500/50 text-pink-300 p-2 rounded text-sm">心境 -{10 * pendingDecision.roamValue}</button>
                          <button onClick={() => pendingDecision.onResolve({axis: 'ENERGY', sign: 1, x: pendingDecision.roamValue})} className="bg-slate-800 border border-emerald-500/50 text-emerald-300 p-2 rounded text-sm">能量 +{10 * pendingDecision.roamValue}</button>
                          <button onClick={() => pendingDecision.onResolve({axis: 'ENERGY', sign: -1, x: pendingDecision.roamValue})} className="bg-slate-800 border border-emerald-500/50 text-emerald-300 p-2 rounded text-sm">能量 -{10 * pendingDecision.roamValue}</button>
                      </div>
                  )}
                  {pendingDecision.type === 'SELECT_HAND_CARD' && (
                      <div className="grid grid-cols-3 gap-2">
                          {game.hand.map((card, i) => (
                              card.name !== pendingDecision.cardName && <div key={i} onClick={() => pendingDecision.onResolve(i)} className="cursor-pointer scale-75 origin-top-left"><Card card={card} size="sm" /></div>
                          ))}
                      </div>
                  )}
                  {pendingDecision.type === 'SELECT_GRAVEYARD_CARD' && (
                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {game.graveyard.filter(c => c.type === pendingDecision.filterType).map((card, i) => (
                              <div key={i} onClick={() => pendingDecision.onResolve(card)} className="cursor-pointer scale-75 origin-top-left"><Card card={card} size="sm" /></div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Header Info */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 z-20 shrink-0 flex flex-col gap-2 shadow-lg">
         <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600">
                     <img src={`https://picsum.photos/seed/${game.character.avatarSeed}/100/100`} />
                </div>
                <div>
                    <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
                        {game.character.name}
                        <button onClick={() => setViewingTraits(true)} className="text-slate-400 hover:text-white"><Info size={14}/></button>
                    </div>
                    <div className="text-[10px] text-slate-400">耐心: <span className="text-amber-500">{game.patience}</span></div>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                 <div className="text-right">
                     <div className="text-[10px] text-slate-400">行动力</div>
                     <div className="font-bold text-blue-400 text-sm">{game.maxPlaysThisTurn - game.cardsPlayedThisTurn}/{game.maxPlaysThisTurn}</div>
                 </div>
                 <button onClick={() => setActiveDrawer('tools')} className="p-2 bg-slate-800 rounded border border-slate-700">
                     <Menu size={16} />
                 </button>
             </div>
         </div>
         
         {/* Stats Bars with Preview */}
         <div className="grid grid-cols-2 gap-3">
             {renderProgressBar(game.mood, prediction?.moodDelta, "bg-pink-900/60", "bg-emerald-400", <Heart size={12} className="text-pink-400 relative z-10" />, "/ 75")}
             {renderProgressBar(game.energy, prediction?.energyDelta, "bg-emerald-900/60", "bg-emerald-400", <Activity size={12} className="text-emerald-400 relative z-10" />, "/ 75")}
         </div>
      </div>

      {/* Main Visual Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-full h-px bg-slate-500"></div> 
              <div className="h-full w-px bg-slate-500 absolute"></div> 
          </div>

          <div className="absolute top-2 right-2 text-emerald-500/20 font-bold text-2xl select-none">希望</div>
          <div className="absolute top-2 left-2 text-red-500/20 font-bold text-2xl select-none">焦虑</div>
          <div className="absolute bottom-2 right-2 text-pink-500/20 font-bold text-2xl select-none">幸福</div>
          <div className="absolute bottom-2 left-2 text-blue-500/20 font-bold text-2xl select-none">悲伤</div>

          <div className="absolute border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 backdrop-blur-sm rounded-lg flex items-center justify-center" style={{right: '0%', top: '0%', width: '25%', height: '25%' }}>
              <span className="text-emerald-500/50 text-[10px] font-bold">目标</span>
          </div>

          {/* Current State Dot */}
          <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] ring-2 ring-white/30 transition-all duration-700 ease-out z-10"
            style={{ left: `${getCoordinates(game.mood)}%`, bottom: `${getCoordinates(game.energy)}%`, transform: 'translate(-50%, 50%)' }}>
          </div>

          {/* GHOST DOT PREVIEW */}
          {prediction && (
            <>
               {/* Trajectory Line */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <line 
                    x1={`${getCoordinates(game.mood)}%`} 
                    y1={`${100 - getCoordinates(game.energy)}%`}
                    x2={`${getCoordinates(prediction.mood)}%`} 
                    y2={`${100 - getCoordinates(prediction.energy)}%`}
                    stroke="rgba(255,255,255,0.3)" 
                    strokeWidth="2" 
                    strokeDasharray="4 4"
                  />
               </svg>
               {/* Ghost Dot */}
               <div className="absolute w-4 h-4 bg-transparent border-2 border-white/50 rounded-full z-10 animate-pulse"
                    style={{ 
                        left: `${getCoordinates(prediction.mood)}%`, 
                        bottom: `${getCoordinates(prediction.energy)}%`, 
                        transform: 'translate(-50%, 50%)' 
                    }}>
               </div>
            </>
          )}

          {/* Status Indicators */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-1 items-center w-full px-4 pointer-events-none">
               {game.sensitivity > 0 && <div className="bg-pink-500/20 text-pink-300 border border-pink-500/50 px-2 py-0.5 rounded text-[10px] animate-pulse">敏感: {game.sensitivity} 层</div>}
               {game.dullness > 0 && <div className="bg-gray-500/20 text-gray-300 border border-gray-500/50 px-2 py-0.5 rounded text-[10px]">迟钝: {game.dullness} 层</div>}
               {game.character.id === 'han-yi' && <div className={`px-2 py-0.5 rounded text-[10px] border shadow-lg ${game.experienceCardsPlayedThisTurn === 0 ? 'bg-gray-800/90 text-gray-400 border-gray-600' : 'bg-red-900/90 text-red-300 border-red-500 animate-pulse'}`}>特性: {game.experienceCardsPlayedThisTurn === 0 ? "下张无效" : "双倍生效"}</div>}
          </div>

          {logs.length > 0 && (
               <div onClick={() => setActiveDrawer('log')} className="mt-auto mb-2 mx-auto bg-black/40 backdrop-blur-sm border border-slate-700/50 rounded-full px-3 py-1 text-[10px] text-slate-300 truncate max-w-[80%] cursor-pointer flex items-center gap-1">
                   <MessageSquare size={10} className="text-slate-500"/>
                   {logs[logs.length-1].message}
               </div>
           )}

          {/* Round End Quote Overlay */}
          {phase === TurnPhase.ROUND_END_DIALOGUE && (
               <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
                  <div className="text-center animate-fade-in">
                      <p className="text-lg text-slate-200 italic mb-4">"{logs[logs.length-1]?.message?.replace('客人: "', '').replace('"', '')}"</p>
                  </div>
              </div>
          )}
          
          {phase === TurnPhase.PLAYER_DISCARD_CHOICE && (
              <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center p-6 text-center">
                  <h2 className="text-xl font-bold text-white mb-2">保留一张手牌</h2>
                  <button onClick={discardAllAndEndRound} className="bg-slate-800 border border-red-500/50 text-red-300 px-4 py-2 rounded text-sm font-bold flex items-center gap-2"><Trash2 size={14} /> 全部弃置</button>
              </div>
          )}
          
           {isGameOver && (
              <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-6 text-center">
                  <h1 className="text-3xl font-bold mb-2 text-white">{phase === TurnPhase.GAME_OVER_WIN ? "咨询成功" : "咨询中止"}</h1>
                  <button onClick={() => setPhase(TurnPhase.CHARACTER_SELECTION)} className="mt-6 bg-white text-slate-900 px-6 py-2 rounded-full font-bold">返回</button>
              </div>
          )}
      </div>

      {/* Control Bar */}
      <div className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="flex gap-2">
              <button onClick={() => setViewingPile('deck')} className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded"><Layers size={12} /> {game.deck.length}</button>
              <button onClick={() => setViewingPile('graveyard')} className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded"><Archive size={12} /> {game.graveyard.length}</button>
          </div>
          
          <div className="flex gap-2">
             {game.activeItem?.id === 'i-17' && !game.itemMagicTrickUsed && phase === TurnPhase.PLAYER_TURN && (
                <button onClick={activateMagicTrick} className="p-1 bg-purple-900/50 text-purple-300 rounded border border-purple-500/30"><Sparkles size={14} /></button>
            )}
             {phase === TurnPhase.PLAYER_TURN && (
                 <button onClick={handleEndTurnClick} className="flex items-center gap-1 bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">结束 <PlayCircle size={12} /></button>
             )}
          </div>
      </div>

      {/* Hand Area */}
      <div className="h-44 bg-slate-925 relative shrink-0 overflow-hidden border-t border-slate-800 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
          <div className="w-full h-full flex items-center px-4 overflow-x-auto gap-2 pb-2 pt-4 no-scrollbar">
                {game.hand.map((card, i) => {
                    let isPlayable = false;
                    let onClickAction = undefined;
                    if (phase === TurnPhase.PLAYER_TURN) {
                        isPlayable = game.cardsPlayedThisTurn < game.maxPlaysThisTurn;
                        onClickAction = () => isPlayable && playCard(card, i);
                    } else if (phase === TurnPhase.PLAYER_DISCARD_CHOICE) {
                        isPlayable = true;
                        onClickAction = () => keepCardAndEndRound(i);
                    }
                    return (
                        <div key={card.id} className={`transform transition-all shrink-0`} style={{ zIndex: i }}>
                            <Card 
                                card={card} 
                                size="sm"
                                isPlayable={isPlayable}
                                onClick={onClickAction}
                                onMouseEnter={() => phase === TurnPhase.PLAYER_TURN && setHoveredCardIndex(i)}
                                onMouseLeave={() => setHoveredCardIndex(null)}
                            />
                        </div>
                    )
                })}
          </div>
      </div>
    </div>
  );
}
