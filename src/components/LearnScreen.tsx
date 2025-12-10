import React, { useState } from 'react';
import { ChevronRight, Music, BookOpen, Volume2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { CHORD_TYPES, SCALE_TYPES, INTERVALS, NOTE_NAMES } from '../types/music';
import { useAudio } from '../hooks/useAudio';

type LearnSection = 'overview' | 'chords' | 'scales' | 'intervals' | 'circle';

export function LearnScreen() {
  const [activeSection, setActiveSection] = useState<LearnSection>('overview');

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0f0c29] via-[#0f0c29] to-transparent pb-4 px-4 pt-6">
        <h1 className="text-2xl font-bold mb-4">Learn</h1>

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'chords', label: 'Chords' },
            { id: 'scales', label: 'Scales' },
            { id: 'intervals', label: 'Intervals' },
            { id: 'circle', label: 'Circle of 5ths' },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as LearnSection)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        {activeSection === 'overview' && <OverviewSection setSection={setActiveSection} />}
        {activeSection === 'chords' && <ChordsSection />}
        {activeSection === 'scales' && <ScalesSection />}
        {activeSection === 'intervals' && <IntervalsSection />}
        {activeSection === 'circle' && <CircleOfFifthsSection />}
      </div>
    </div>
  );
}

function OverviewSection({ setSection }: { setSection: (s: LearnSection) => void }) {
  const topics = [
    {
      id: 'chords',
      title: 'Chord Types',
      description: 'Learn major, minor, diminished, augmented, and 7th chords',
      icon: '🎹',
      count: Object.keys(CHORD_TYPES).length,
    },
    {
      id: 'scales',
      title: 'Scales & Modes',
      description: 'Master major, minor, and modal scales',
      icon: '🎼',
      count: Object.keys(SCALE_TYPES).length,
    },
    {
      id: 'intervals',
      title: 'Intervals',
      description: 'Understand the distance between notes',
      icon: '📏',
      count: Object.keys(INTERVALS).length,
    },
    {
      id: 'circle',
      title: 'Circle of Fifths',
      description: 'The foundational music theory diagram',
      icon: '🔄',
      count: 12,
    },
  ];

  return (
    <div className="space-y-4 animate-in">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Welcome to Learn!</h2>
        <p className="text-sm text-white/60">
          Explore music theory concepts with interactive examples. Tap any chord, scale, or interval to hear how it sounds.
        </p>
      </Card>

      {topics.map(topic => (
        <Card
          key={topic.id}
          hover
          onClick={() => setSection(topic.id as LearnSection)}
          className="p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-2xl">
              {topic.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{topic.title}</h3>
                <Badge variant="purple" size="sm">{topic.count}</Badge>
              </div>
              <p className="text-sm text-white/60">{topic.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChordsSection() {
  const audio = useAudio();
  const [expandedChord, setExpandedChord] = useState<string | null>(null);

  const playChordDemo = (quality: string) => {
    const chord = CHORD_TYPES[quality as keyof typeof CHORD_TYPES];
    if (chord) {
      const rootMidi = 60; // C4
      const notes = chord.intervals.map(i => rootMidi + i);
      audio.playChord(notes);
    }
  };

  return (
    <div className="space-y-3 animate-in">
      {Object.entries(CHORD_TYPES).map(([key, chord]) => (
        <Card
          key={key}
          className="overflow-hidden"
        >
          <button
            onClick={() => setExpandedChord(expandedChord === key ? null : key)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <div className="font-semibold">{chord.name}</div>
              <div className="text-sm text-white/60">{chord.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playChordDemo(key);
                }}
                className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
              </button>
              <ChevronRight
                className={`w-5 h-5 text-white/40 transition-transform ${
                  expandedChord === key ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>

          {expandedChord === key && (
            <div className="px-4 pb-4 border-t border-white/10 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Symbol:</span>
                  <span className="ml-2 font-mono">C{chord.shortName}</span>
                </div>
                <div>
                  <span className="text-white/60">Intervals:</span>
                  <span className="ml-2 font-mono">{chord.intervals.join('-')}</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-white/60 text-sm">Notes in C:</span>
                <div className="flex gap-2 mt-2">
                  {chord.intervals.map((interval, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-purple-500/20 text-sm font-mono"
                    >
                      {NOTE_NAMES[interval % 12]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ScalesSection() {
  const audio = useAudio();
  const [expandedScale, setExpandedScale] = useState<string | null>(null);

  const playScaleDemo = (scaleType: string) => {
    const scale = SCALE_TYPES[scaleType as keyof typeof SCALE_TYPES];
    if (scale) {
      const rootMidi = 60; // C4
      const notes = scale.intervals.map(i => rootMidi + i);
      audio.playScale(notes);
    }
  };

  return (
    <div className="space-y-3 animate-in">
      {Object.entries(SCALE_TYPES).map(([key, scale]) => (
        <Card
          key={key}
          className="overflow-hidden"
        >
          <button
            onClick={() => setExpandedScale(expandedScale === key ? null : key)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <div className="font-semibold">{scale.name}</div>
              <div className="text-sm text-white/60">{scale.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playScaleDemo(key);
                }}
                className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
              </button>
              <ChevronRight
                className={`w-5 h-5 text-white/40 transition-transform ${
                  expandedScale === key ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>

          {expandedScale === key && (
            <div className="px-4 pb-4 border-t border-white/10 pt-4">
              <div className="mb-3">
                <span className="text-white/60 text-sm">Mood:</span>
                <Badge variant="purple" size="sm" className="ml-2">{scale.mood}</Badge>
              </div>
              <div>
                <span className="text-white/60 text-sm">Notes in C:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scale.intervals.map((interval, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-purple-500/20 text-sm font-mono"
                    >
                      {NOTE_NAMES[interval % 12]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function IntervalsSection() {
  const audio = useAudio();

  const playIntervalDemo = (semitones: number) => {
    const rootMidi = 60; // C4
    audio.playInterval(rootMidi, rootMidi + semitones);
  };

  return (
    <div className="space-y-3 animate-in">
      <Card className="p-4 mb-4">
        <p className="text-sm text-white/60">
          An interval is the distance between two notes. Each interval has a unique sound quality that you can learn to recognize.
        </p>
      </Card>

      {Object.entries(INTERVALS).map(([key, interval]) => (
        <Card key={key} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{interval.name}</span>
                <Badge variant="default" size="sm">{interval.shortName}</Badge>
              </div>
              <div className="text-sm text-white/60">{interval.description}</div>
              <div className="text-xs text-purple-400 mt-1">
                {interval.semitones} semitone{interval.semitones !== 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={() => playIntervalDemo(interval.semitones)}
              className="p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
            >
              <Volume2 className="w-5 h-5 text-purple-400" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CircleOfFifthsSection() {
  const audio = useAudio();

  const circleNotes = [
    { major: 'C', minor: 'Am', position: 0 },
    { major: 'G', minor: 'Em', position: 1 },
    { major: 'D', minor: 'Bm', position: 2 },
    { major: 'A', minor: 'F#m', position: 3 },
    { major: 'E', minor: 'C#m', position: 4 },
    { major: 'B', minor: 'G#m', position: 5 },
    { major: 'F#/Gb', minor: 'D#m/Ebm', position: 6 },
    { major: 'Db', minor: 'Bbm', position: 7 },
    { major: 'Ab', minor: 'Fm', position: 8 },
    { major: 'Eb', minor: 'Cm', position: 9 },
    { major: 'Bb', minor: 'Gm', position: 10 },
    { major: 'F', minor: 'Dm', position: 11 },
  ];

  return (
    <div className="space-y-4 animate-in">
      <Card className="p-4">
        <h3 className="font-semibold mb-2">What is the Circle of Fifths?</h3>
        <p className="text-sm text-white/60">
          The Circle of Fifths shows the relationships between the 12 tones of the chromatic scale.
          Moving clockwise, each key is a perfect fifth higher. This is fundamental for understanding key signatures and chord progressions.
        </p>
      </Card>

      {/* Visual Circle */}
      <Card className="p-6">
        <div className="relative w-64 h-64 mx-auto">
          {circleNotes.map((note, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 50 + 40 * Math.cos(angle);
            const y = 50 + 40 * Math.sin(angle);

            return (
              <button
                key={note.major}
                onClick={() => {
                  // Play major chord
                  const noteIndex = ['C', 'G', 'D', 'A', 'E', 'B', 'F#/Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'].indexOf(note.major);
                  const rootMidi = 60 + (noteIndex * 7) % 12;
                  audio.playChord([rootMidi, rootMidi + 4, rootMidi + 7]);
                }}
                className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30
                           flex items-center justify-center text-sm font-semibold hover:from-purple-500/50 hover:to-pink-500/50
                           transition-all transform hover:scale-110"
                style={{
                  left: `calc(${x}% - 24px)`,
                  top: `calc(${y}% - 24px)`,
                }}
              >
                {note.major.split('/')[0]}
              </button>
            );
          })}

          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-white/60">Circle of</div>
              <div className="text-lg font-bold">Fifths</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">All Keys</h3>
        <div className="grid grid-cols-2 gap-2">
          {circleNotes.map(note => (
            <div
              key={note.major}
              className="p-3 rounded-xl bg-white/5 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{note.major}</div>
                <div className="text-xs text-white/60">Relative: {note.minor}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Key Relationships</h3>
        <ul className="text-sm text-white/60 space-y-2">
          <li>• Adjacent keys share 6 of 7 notes</li>
          <li>• Moving clockwise adds one sharp</li>
          <li>• Moving counter-clockwise adds one flat</li>
          <li>• Opposite keys share the least notes</li>
        </ul>
      </Card>
    </div>
  );
}
