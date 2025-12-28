import React, { useEffect, useState } from 'react';
import { Target, Gift, CheckCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { getGoals, updateGoalProgress, claimGoalReward, Goal } from '../utils/storage';

interface GoalsPanelProps {
  onXPClaimed?: (amount: number) => void;
}

const GOAL_ICONS: Record<string, React.ReactNode> = {
  weekly_sessions: <Calendar className="w-5 h-5" />,
  weekly_accuracy: <Target className="w-5 h-5" />,
  skill_mastery: <TrendingUp className="w-5 h-5" />,
  daily_streak: <Clock className="w-5 h-5" />,
};

export function GoalsPanel({ onXPClaimed }: GoalsPanelProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    // Update and load goals
    const updatedGoals = updateGoalProgress();
    setGoals(updatedGoals);
  }, []);

  const handleClaim = async (goalId: string) => {
    setClaimingId(goalId);

    // Animate the claim
    await new Promise(resolve => setTimeout(resolve, 500));

    const reward = claimGoalReward(goalId);
    if (reward > 0 && onXPClaimed) {
      onXPClaimed(reward);
    }

    // Refresh goals
    setGoals(getGoals());
    setClaimingId(null);
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="space-y-4">
      {/* Active Goals */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Active Goals
        </h3>

        {activeGoals.length === 0 ? (
          <Card className="p-4 text-center text-white/60">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm">All goals completed!</p>
          </Card>
        ) : (
          activeGoals.map(goal => (
            <Card key={goal.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  {GOAL_ICONS[goal.type] || <Target className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{goal.name}</h4>
                    {goal.reward && (
                      <Badge variant="purple" className="text-xs">
                        +{goal.reward} XP
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-white/60 mb-2">{goal.description}</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={goal.current}
                      max={goal.target}
                      size="sm"
                      color="purple"
                      className="flex-1"
                    />
                    <span className="text-xs text-white/60">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  {goal.endDate && (
                    <p className="text-xs text-white/40 mt-1">
                      Ends: {new Date(goal.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Completed
          </h3>

          {completedGoals.map(goal => (
            <Card
              key={goal.id}
              className={`p-4 ${goal.reward ? 'border-2 border-yellow-500/50 bg-yellow-500/5' : 'opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{goal.name}</h4>
                    <p className="text-xs text-white/60">
                      Completed {goal.completedDate ? new Date(goal.completedDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                {goal.reward && goal.reward > 0 ? (
                  <button
                    onClick={() => handleClaim(goal.id)}
                    disabled={claimingId === goal.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      claimingId === goal.id
                        ? 'bg-yellow-500/20 text-yellow-400 animate-pulse'
                        : 'bg-yellow-500 text-black hover:bg-yellow-400'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    {claimingId === goal.id ? 'Claiming...' : `+${goal.reward} XP`}
                  </button>
                ) : (
                  <Badge variant="success">Claimed</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
