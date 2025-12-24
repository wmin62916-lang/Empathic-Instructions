
import React, { useEffect, useRef } from 'react';
import { GameLogEntry } from '../types';

interface GameLogProps {
  logs: GameLogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-lg border border-slate-800 p-3 overflow-hidden font-mono">
      <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
        咨询记录
      </h4>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {logs.map((log) => (
          <div key={log.id} className="text-xs leading-relaxed">
            <span className={`mr-2
              ${log.type === 'positive' ? 'text-emerald-500' : 
                log.type === 'negative' ? 'text-red-500' : 
                log.type === 'system' ? 'text-amber-500' : 'text-slate-500'}
            `}>
              {log.type === 'system' ? '>' : '#'}
            </span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
