import React, { useState, useCallback } from 'react';
import { Target, Check, Plus, Trash2, ChevronLeft, Trophy } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { getWeeklyGoals, setWeeklyGoals, WeeklyGoal, WeeklyGoalsData } from '../utils/storage';

interface WeeklyGoalsProps {
  onBack: () => void;
}

const GOAL_TEMPLATES: { type: WeeklyGoal['type']; label: string; icon: string; presets: number[] }[] = [
  { type: 'questions', label: 'Answer Questions', icon: '🎯', presets: [50, 100, 200, 500] },
  { type: 'minutes', label: 'Practice Minutes', icon: '⏱️', presets: [15, 30, 60, 120] },
  { type: 'accuracy', label: 'Accuracy Target', icon: '🎯', presets: [70, 80, 90, 95] },
  { type: 'streak', label: 'Best Streak', icon: '🔥', presets: [5, 10, 20, 50] },
];

export function WeeklyGoals({ onBack }: WeeklyGoalsProps) {
  const [goalsData, setGoalsData] = useState<WeeklyGoalsData>(getWeeklyGoals());
  const [isEditing, setIsEditing] = useState(goalsData.goals.length === 0);
  const [selectedGoals, setSelectedGoals] = useState<{ type: WeeklyGoal['type']; target: number }[]>(
    goalsData.goals.map(g => ({ type: g.type, target: g.target }))
  );

  const handleAddGoal = useCallback((type: WeeklyGoal['type'], target: number) => {
    setSelectedGoals(prev => {
      // Replace if same type exists
      const filtered = prev.filter(g => g.type !== type);
      return [...filtered, { type, target }];
    });
  }, []);

  const handleRemoveGoal = useCallback((type: WeeklyGoal['type']) => {
    setSelectedGoals(prev => prev.filter(g => g.type !== type));
  }, []);

  const handleSaveGoals = useCallback(() => {
    const updated = setWeeklyGoals(selectedGoals);
    setGoalsData(updated);
    setIsEditing(false);
  }, [selectedGoals]);

  const allCompleted = goalsData.goals.length > 0 && goalsData.goals.every(g => g.completed);

  const getGoalLabel = (type: WeeklyGoal['type']) => {
    return GOAL_TEMPLATES.find(t => t.type === type)?.label || type;
  };

  const getGoalUnit = (type: WeeklyGoal['type']) => {
    switch (type) {
      case 'questions': return 'questions';
      case 'minutes': return 'minutes';
      case 'accuracy': return '%';
      case 'streak': return 'in a row';
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Weekly Goals</h1>
          <p className="text-sm text-white/60">Set targets for this week</p>
        </div>
        {!isEditing && goalsData.goals.length > 0 && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
          >
            Edit
          </button>
        )}
      </div>

      {/* Completion Banner */}
      {allCompleted && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div>
              <h3 className="font-bold text-yellow-300">All Goals Completed!</h3>
              <p className="text-sm text-white/60">
                {goalsData.totalWeeksCompleted} weeks completed total
              </p>
            </div>
          </div>
        </Card>
      )}

      {isEditing ? (
        /* Editing View */
        <div className="space-y-4">
          <p className="text-sm text-white/60">Choose your goals for this week:</p>

          {GOAL_TEMPLATES.map(template => {
            const selected = selectedGoals.find(g => g.type === template.type);
            return (
              <Card key={template.type} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{template.icon}</span>
                  <h3 className="font-semibold flex-1">{template.label}</h3>
                  {selected && (
                    <button
                      onClick={() => handleRemoveGoal(template.type)}
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {template.presets.map(target => (
                    <button
                      key={target}
                      onClick={() => handleAddGoal(template.type, target)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        selected?.target === target
                          ? 'bg-purple-500/30 border border-purple-500 text-purple-300'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {target}{template.type === 'accuracy' ? '%' : ''}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSaveGoals}
            disabled={selectedGoals.length === 0}
            icon={<Check className="w-5 h-5" />}
          >
            Save Goals ({selectedGoals.length} selected)
          </Button>
        </div>
      ) : (
        /* Progress View */
        <div className="space-y-4">
          {goalsData.goals.length === 0 ? (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto text-white/40 mb-4" />
              <h3 className="font-semibold mb-2">No Goals Set</h3>
              <p className="text-sm text-white/60 mb-4">Set weekly targets to stay motivated</p>
              <Button variant="primary" onClick={() => setIsEditing(true)} icon={<Plus className="w-5 h-5" />}>
                Set Goals
              </Button>
            </Card>
          ) : (
            goalsData.goals.map(goal => {
              const percentage = Math.min(100, (goal.current / goal.target) * 100);
              return (
                <Card key={goal.id} className={`p-4 ${goal.completed ? 'bg-green-500/10 border-green-500/20' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {goal.completed && <Check className="w-5 h-5 text-green-400" />}
                      <h3 className="font-semibold">{getGoalLabel(goal.type)}</h3>
                    </div>
                    <Badge variant={goal.completed ? 'success' : 'default'}>
                      {goal.current}/{goal.target} {getGoalUnit(goal.type)}
                    </Badge>
                  </div>
                  <Progress
                    value={percentage}
                    max={100}
                    size="sm"
                    color={goal.completed ? 'green' : percentage > 50 ? 'purple' : 'amber'}
                  />
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
