import React, { useState } from 'react';
import { X, Plus, Play, Save, Trash2, Music, Settings2 } from 'lucide-react';
import { ChordQuality, ScaleType, CHORD_TYPES, SCALE_TYPES } from '../types/music';
import { Card, Button, Badge } from './ui';

export interface CustomPracticeSet {
  id: string;
  name: string;
  description: string;
  chords: ChordQuality[];
  scales: ScaleType[];
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

interface CustomPracticeBuilderProps {
  onClose: () => void;
  onStartPractice?: (set: CustomPracticeSet) => void;
  savedSets?: CustomPracticeSet[];
  onSaveSet?: (set: CustomPracticeSet) => void;
  onDeleteSet?: (id: string) => void;
}

const CHORD_CATEGORIES = {
  'Basic': ['major', 'minor', 'diminished', 'augmented'] as ChordQuality[],
  '7th Chords': ['major7', 'minor7', 'dominant7', 'diminished7', 'half_diminished7'] as ChordQuality[],
  'Extended': ['dominant9', 'major9', 'minor9', 'dominant11', 'dominant13'] as ChordQuality[],
  'Altered': ['dominant7sharp9', 'dominant7flat9', 'dominant7sharp5', 'dominant7flat5', 'dominant7alt'] as ChordQuality[],
  'Suspended': ['sus2', 'sus4', 'add9', 'add11'] as ChordQuality[],
  '6th Chords': ['6', 'minor6', '69'] as ChordQuality[],
};

const SCALE_CATEGORIES = {
  'Basic': ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor'] as ScaleType[],
  'Modes': ['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'aeolian'] as ScaleType[],
  'Pentatonic & Blues': ['pentatonic_major', 'pentatonic_minor', 'blues'] as ScaleType[],
  'Bebop': ['bebop_dominant', 'bebop_major', 'bebop_minor', 'bebop_dorian'] as ScaleType[],
  'Symmetric': ['whole_tone', 'diminished_whole_half', 'diminished_half_whole', 'chromatic'] as ScaleType[],
  'World': ['phrygian_dominant', 'hungarian_minor', 'double_harmonic', 'japanese', 'hirajoshi'] as ScaleType[],
};

export function CustomPracticeBuilder({
  onClose,
  onStartPractice,
  savedSets = [],
  onSaveSet,
  onDeleteSet,
}: CustomPracticeBuilderProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChords, setSelectedChords] = useState<ChordQuality[]>([]);
  const [selectedScales, setSelectedScales] = useState<ScaleType[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleChord = (chord: ChordQuality) => {
    setSelectedChords(prev =>
      prev.includes(chord) ? prev.filter(c => c !== chord) : [...prev, chord]
    );
  };

  const toggleScale = (scale: ScaleType) => {
    setSelectedScales(prev =>
      prev.includes(scale) ? prev.filter(s => s !== scale) : [...prev, scale]
    );
  };

  const selectCategory = (category: string, type: 'chord' | 'scale') => {
    if (type === 'chord') {
      const categoryChords = CHORD_CATEGORIES[category as keyof typeof CHORD_CATEGORIES];
      const allSelected = categoryChords.every(c => selectedChords.includes(c));
      if (allSelected) {
        setSelectedChords(prev => prev.filter(c => !categoryChords.includes(c)));
      } else {
        setSelectedChords(prev => [...new Set([...prev, ...categoryChords])]);
      }
    } else {
      const categoryScales = SCALE_CATEGORIES[category as keyof typeof SCALE_CATEGORIES];
      const allSelected = categoryScales.every(s => selectedScales.includes(s));
      if (allSelected) {
        setSelectedScales(prev => prev.filter(s => !categoryScales.includes(s)));
      } else {
        setSelectedScales(prev => [...new Set([...prev, ...categoryScales])]);
      }
    }
  };

  const handleSave = () => {
    if (!name.trim() || (selectedChords.length === 0 && selectedScales.length === 0)) return;

    const newSet: CustomPracticeSet = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      chords: selectedChords,
      scales: selectedScales,
      questionCount,
      difficulty,
      createdAt: new Date().toISOString(),
    };

    onSaveSet?.(newSet);
    setName('');
    setDescription('');
    setSelectedChords([]);
    setSelectedScales([]);
    setActiveTab('saved');
  };

  const handleStartQuick = () => {
    if (selectedChords.length === 0 && selectedScales.length === 0) return;

    const quickSet: CustomPracticeSet = {
      id: `quick_${Date.now()}`,
      name: 'Quick Practice',
      description: '',
      chords: selectedChords,
      scales: selectedScales,
      questionCount,
      difficulty,
      createdAt: new Date().toISOString(),
    };

    onStartPractice?.(quickSet);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Settings2 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Custom Practice Builder</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'create' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/60 hover:text-white'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'saved' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/60 hover:text-white'
            }`}
          >
            Saved Sets ({savedSets.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              {/* Name & Description */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Practice Set Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Jazz Voicings"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Focus on extended chords"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Questions: {questionCount}</label>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                          difficulty === d
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chord Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  Select Chords ({selectedChords.length})
                </h3>
                <div className="space-y-2">
                  {Object.entries(CHORD_CATEGORIES).map(([category, chords]) => {
                    const selectedCount = chords.filter(c => selectedChords.includes(c)).length;
                    const isExpanded = expandedCategory === `chord-${category}`;

                    return (
                      <div key={category} className="bg-white/5 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : `chord-${category}`)}
                          className="w-full flex items-center justify-between p-3 hover:bg-white/5"
                        >
                          <span className="font-medium">{category}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={selectedCount > 0 ? 'purple' : 'default'}>
                              {selectedCount}/{chords.length}
                            </Badge>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectCategory(category, 'chord');
                              }}
                              className="text-xs px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-purple-300"
                            >
                              {selectedCount === chords.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="p-3 pt-0 flex flex-wrap gap-2">
                            {chords.map(chord => (
                              <button
                                key={chord}
                                onClick={() => toggleChord(chord)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  selectedChords.includes(chord)
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                              >
                                {CHORD_TYPES[chord].name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scale Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-400" />
                  Select Scales ({selectedScales.length})
                </h3>
                <div className="space-y-2">
                  {Object.entries(SCALE_CATEGORIES).map(([category, scales]) => {
                    const selectedCount = scales.filter(s => selectedScales.includes(s)).length;
                    const isExpanded = expandedCategory === `scale-${category}`;

                    return (
                      <div key={category} className="bg-white/5 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : `scale-${category}`)}
                          className="w-full flex items-center justify-between p-3 hover:bg-white/5"
                        >
                          <span className="font-medium">{category}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={selectedCount > 0 ? 'info' : 'default'}>
                              {selectedCount}/{scales.length}
                            </Badge>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectCategory(category, 'scale');
                              }}
                              className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300"
                            >
                              {selectedCount === scales.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="p-3 pt-0 flex flex-wrap gap-2">
                            {scales.map(scale => (
                              <button
                                key={scale}
                                onClick={() => toggleScale(scale)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  selectedScales.includes(scale)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                              >
                                {SCALE_TYPES[scale].name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSets.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Settings2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No saved practice sets yet</p>
                  <p className="text-sm mt-2">Create your first custom set!</p>
                </div>
              ) : (
                savedSets.map(set => (
                  <div
                    key={set.id}
                    className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{set.name}</h3>
                      {set.description && (
                        <p className="text-sm text-white/60 mt-1">{set.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge>{set.chords.length} chords</Badge>
                        <Badge>{set.scales.length} scales</Badge>
                        <Badge>{set.questionCount} questions</Badge>
                        <Badge>{set.difficulty}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" onClick={() => onStartPractice?.(set)}>
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onDeleteSet?.(set.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'create' && (
          <div className="p-4 border-t border-white/10 flex gap-3">
            <Button
              variant="secondary"
              onClick={handleStartQuick}
              disabled={selectedChords.length === 0 && selectedScales.length === 0}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Quick Start
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || (selectedChords.length === 0 && selectedScales.length === 0)}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Start
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
