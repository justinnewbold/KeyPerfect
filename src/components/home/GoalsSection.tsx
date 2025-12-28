import React from 'react';
import { Target } from 'lucide-react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Goal } from '../../utils/storage';

interface GoalsSectionProps {
  activeGoals: Goal[];
  completedWithReward: Goal[];
  onViewAll: () => void;
}

export function GoalsSection({ activeGoals, completedWithReward, onViewAll }: GoalsSectionProps) {
  if (activeGoals.length === 0 && completedWithReward.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" aria-hidden="true" />
          Goals
        </h2>
        <button
          onClick={onViewAll}
          className="text-sm text-purple-400 hover:text-purple-300"
          aria-label="View all goals"
        >
          View All
        </button>
      </div>
      <div className="space-y-2">
        {completedWithReward.length > 0 && (
          <Card className="p-3 border-2 border-yellow-500/50 bg-yellow-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">🎁</span>
                <span className="text-sm">{completedWithReward.length} reward{completedWithReward.length > 1 ? 's' : ''} to claim!</span>
              </div>
              <button
                onClick={onViewAll}
                className="px-3 py-1 rounded-lg bg-yellow-500 text-black text-sm font-medium"
                aria-label="Claim rewards"
              >
                Claim
              </button>
            </div>
          </Card>
        )}
        {activeGoals.slice(0, 2).map(goal => (
          <Card key={goal.id} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{goal.name}</span>
              <span className="text-xs text-white/60">{goal.current}/{goal.target}</span>
            </div>
            <Progress value={goal.current} max={goal.target} size="sm" color="purple" />
          </Card>
        ))}
      </div>
    </div>
  );
}
