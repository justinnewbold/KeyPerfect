import React, { useState } from 'react';
import { X, Plus, Save, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { saveCustomPreset, getCustomPresets, deleteCustomPreset, CustomPreset } from '../utils/storage';

interface CustomPracticeBuilderProps {
  onClose: () => void;
  onStartCustom: (preset: CustomPreset) => void;
}

const ICONS = ['🎯', '🎵', '🎹', '🎼', '🎸', '🥁', '🎤', '⚡', '🔥', '💪', '🧠', '📚'];

const MODE_OPTIONS = [
  { id: 'chords', label: 'Chords', icon: '🎹' },
  { id: 'scales', label: 'Scales', icon: '🎼' },
  { id: 'intervals', label: 'Intervals', icon: '📏' },
] as const;

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy', color: 'bg-green-500/20 text-green-400' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'hard', label: 'Hard', color: 'bg-red-500/20 text-red-400' },
  { id: 'progressive', label: 'Progressive', color: 'bg-purple-500/20 text-purple-400' },
] as const;

export function CustomPracticeBuilder({ onClose, onStartCustom }: CustomPracticeBuilderProps) {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(getCustomPresets());
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'progressive'>('progressive');
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [selectedModes, setSelectedModes] = useState<('chords' | 'scales' | 'intervals')[]>(['chords']);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('🎯');
    setQuestionCount(10);
    setDifficulty('progressive');
    setTimeLimit(undefined);
    setHasTimeLimit(false);
    setSelectedModes(['chords']);
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!name.trim() || selectedModes.length === 0) return;

    const newPreset = saveCustomPreset({
      name: name.trim(),
      description: description.trim() || `${questionCount} questions, ${difficulty} difficulty`,
      icon,
      questionCount,
      difficulty,
      timeLimit: hasTimeLimit ? timeLimit : undefined,
      modes: selectedModes,
    });

    setCustomPresets([...customPresets, newPreset]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteCustomPreset(id);
    setCustomPresets(customPresets.filter(p => p.id !== id));
  };

  const toggleMode = (mode: 'chords' | 'scales' | 'intervals') => {
    if (selectedModes.includes(mode)) {
      if (selectedModes.length > 1) {
        setSelectedModes(selectedModes.filter(m => m !== mode));
      }
    } else {
      setSelectedModes([...selectedModes, mode]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#1a1635] to-[#0f0c29] rounded-2xl border border-white/10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1a1635] p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Custom Practice</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Saved Presets */}
          {customPresets.length > 0 && !isCreating && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/60">Your Custom Presets</h3>
              {customPresets.map(preset => (
                <Card
                  key={preset.id}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                  onClick={() => onStartCustom(preset)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs text-white/60">
                        {preset.questionCount}q • {preset.difficulty} • {preset.modes.join(', ')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(preset.id); }}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          )}

          {/* Create New Button */}
          {!isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full"
              variant="secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Preset
            </Button>
          )}

          {/* Create Form */}
          {isCreating && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/60">Create New Preset</h3>

              {/* Name */}
              <div>
                <label className="text-sm text-white/60 mb-1 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Custom Practice"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="text-sm text-white/60 mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        icon === i ? 'bg-purple-500/20 ring-2 ring-purple-500' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modes */}
              <div>
                <label className="text-sm text-white/60 mb-1 block">Practice Modes</label>
                <div className="flex flex-wrap gap-2">
                  {MODE_OPTIONS.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => toggleMode(mode.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        selectedModes.includes(mode.id)
                          ? 'bg-purple-500/20 border border-purple-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span className="text-sm">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="text-sm text-white/60 mb-1 block">
                  Questions: {questionCount}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-sm text-white/60 mb-1 block">Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setDifficulty(opt.id)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        difficulty === opt.id
                          ? `${opt.color} border border-current`
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/60">Time Limit</label>
                  <button
                    onClick={() => setHasTimeLimit(!hasTimeLimit)}
                    className={`w-10 h-6 rounded-full transition-all ${
                      hasTimeLimit ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${
                      hasTimeLimit ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                {hasTimeLimit && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="30"
                      max="600"
                      step="30"
                      value={timeLimit || 120}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-white/60">seconds</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || selectedModes.length === 0}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preset
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
