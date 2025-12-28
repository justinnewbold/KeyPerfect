import React from 'react';
import { Calendar, Zap, Heart, Timer } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ChallengeModeType } from '../../types/gameModes';

interface ChallengeModesProps {
  canPlayDaily: boolean;
  onStartChallenge: (mode: ChallengeModeType) => void;
}

export function ChallengeModes({ canPlayDaily, onStartChallenge }: ChallengeModesProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Challenge Modes</h2>
      <div className="grid grid-cols-2 gap-3">
        {/* Daily Challenge */}
        <Card
          hover={canPlayDaily}
          onClick={() => canPlayDaily && onStartChallenge('daily')}
          className={`p-4 ${!canPlayDaily ? 'opacity-60' : ''}`}
          role="button"
          aria-label={canPlayDaily ? 'Start Daily Challenge' : 'Daily Challenge completed'}
          aria-disabled={!canPlayDaily}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-semibold">Daily</h4>
              {!canPlayDaily && (
                <Badge variant="success" size="sm">Completed</Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-white/60">New challenge every day</p>
        </Card>

        {/* Speed Run */}
        <Card
          hover
          onClick={() => onStartChallenge('speedrun')}
          className="p-4"
          role="button"
          aria-label="Start Speed Run challenge"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="font-semibold">Speed Run</h4>
          </div>
          <p className="text-xs text-white/60">60 seconds, max points</p>
        </Card>

        {/* Survival */}
        <Card
          hover
          onClick={() => onStartChallenge('survival')}
          className="p-4"
          role="button"
          aria-label="Start Survival challenge"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="font-semibold">Survival</h4>
          </div>
          <p className="text-xs text-white/60">3 lives, how far can you go?</p>
        </Card>

        {/* Time Attack */}
        <Card
          hover
          onClick={() => onStartChallenge('timeattack')}
          className="p-4"
          role="button"
          aria-label="Start Time Attack challenge"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Timer className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="font-semibold">Time Attack</h4>
          </div>
          <p className="text-xs text-white/60">Beat the clock</p>
        </Card>
      </div>
    </div>
  );
}
