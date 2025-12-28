import React from 'react';
import { Card } from '../ui/Card';
import { GAME_MODES, GameModeType } from '../../types/gameModes';

interface TrainingModesProps {
  onStartGameMode: (mode: GameModeType) => void;
}

export function TrainingModes({ onStartGameMode }: TrainingModesProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Training Modes</h2>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(GAME_MODES).map(mode => (
          <Card
            key={mode.id}
            hover
            onClick={() => onStartGameMode(mode.id)}
            className="p-4"
            role="button"
            aria-label={`Start ${mode.name} training`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                <span className="text-lg" aria-hidden="true">{mode.icon}</span>
              </div>
              <h4 className="font-semibold text-sm">{mode.name}</h4>
            </div>
            <p className="text-xs text-white/60 line-clamp-2">{mode.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
