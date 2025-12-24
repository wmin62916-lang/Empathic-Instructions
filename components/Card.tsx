
import React from 'react';
import { Card as CardType, CardType as CType, Rarity } from '../types';
import { Heart, Activity, MessageCircle, Sparkles, Box } from 'lucide-react';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
  isPlayable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBack?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  onMouseEnter,
  onMouseLeave,
  disabled = false, 
  isPlayable = false, 
  size = 'md',
  showBack = false
}) => {
  if (showBack) {
    return (
      <div 
        className={`
          relative rounded-xl border border-slate-700 bg-slate-900 shadow-xl
          ${size === 'sm' ? 'w-24 h-36' : size === 'md' ? 'w-40 h-60' : 'w-56 h-80'}
          flex items-center justify-center
          bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]
        `}
      >
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
          <Activity className="text-slate-500" size={20} />
        </div>
      </div>
    );
  }

  const rarityColor = {
    [Rarity.COMMON]: 'border-slate-600',
    [Rarity.RARE]: 'border-cyan-500 shadow-cyan-900/30',
    [Rarity.LEGENDARY]: 'border-amber-400 shadow-amber-900/40',
  };

  const glowEffect = isPlayable ? 'ring-2 ring-emerald-400 cursor-pointer hover:-translate-y-2 transition-transform' : '';
  const opacity = disabled ? 'opacity-40 grayscale' : '';
  
  const dims = size === 'sm' ? 'w-24 h-36 text-[10px]' : size === 'md' ? 'w-40 h-60 text-xs' : 'w-56 h-80 text-sm';
  const imgHeight = size === 'sm' ? 'h-14' : size === 'md' ? 'h-24' : 'h-36';

  const isPositive = (val: number) => val > 0;
  const isZero = (val: number) => val === 0;

  return (
    <div 
      onClick={() => !disabled && onClick && onClick()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        relative bg-slate-900 rounded-xl border ${rarityColor[card.rarity]} 
        ${dims} ${glowEffect} ${opacity}
        flex flex-col shadow-lg overflow-hidden select-none
        transition-all duration-200
      `}
    >
      {/* Type Badge */}
      <div className="absolute top-1 right-1 z-10">
         {card.type === CType.EXPERIENCE && <Sparkles size={14} className="text-purple-400" />}
         {card.type === CType.DIALOGUE && <MessageCircle size={14} className="text-blue-400" />}
         {card.type === CType.ITEM && <Box size={14} className="text-amber-400" />}
      </div>

      {/* Image */}
      <div className={`${imgHeight} bg-slate-800 relative overflow-hidden`}>
        <img 
          src={`https://picsum.photos/seed/${card.id}${card.imageKeyword}/300/300`} 
          alt={card.name}
          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
        />
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 to-transparent h-6"></div>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 flex flex-col relative">
        <h3 className="font-bold text-slate-200 truncate leading-tight text-center mb-1">
            {card.name}
        </h3>
        
        <div className="flex-1 overflow-hidden">
            <p className="text-slate-400 italic leading-snug text-center px-1 scale-90">
            {card.description}
            </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-2 grid grid-cols-2 gap-1 bg-slate-950/50 rounded p-1">
            <div className="flex items-center gap-1 justify-center">
                <Heart size={12} className={card.moodEffect > 0 ? "text-pink-400" : "text-slate-500"} />
                <span className={`font-mono font-bold ${card.moodEffect > 0 ? 'text-pink-400' : card.moodEffect < 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                    {card.moodEffect > 0 ? '+' : ''}{card.moodEffect}
                </span>
            </div>
            <div className="flex items-center gap-1 justify-center">
                <Activity size={12} className={card.energyEffect > 0 ? "text-emerald-400" : "text-slate-500"} />
                 <span className={`font-mono font-bold ${card.energyEffect > 0 ? 'text-emerald-400' : card.energyEffect < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                    {card.energyEffect > 0 ? '+' : ''}{card.energyEffect}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};
