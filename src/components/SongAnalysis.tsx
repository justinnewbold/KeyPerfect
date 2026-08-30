import React, { useState, useCallback, useRef } from 'react';
import { X, Music2, Play, Pause, Plus, Trash2, Search, BookOpen } from 'lucide-react';
import { useSwipe } from '../hooks/useSwipe';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Card, Button, Badge } from './ui';
import { ChordQuality, CHORD_TYPES, PROGRESSIONS, ProgressionType } from '../types/music';
import { playChord, getAudioContext, stopAllSounds } from '../utils/audioEngine';
import { getChordNotes } from '../utils/gameHelpers';

interface ChordEntry {
  id: string;
  chord: ChordQuality;
  rootNote: string;
  duration: number; // beats
}

interface SongAnalysisProps {
  onClose: () => void;
}

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const COMMON_SONGS = [
  {
    name: 'Let It Be',
    artist: 'The Beatles',
    key: 'C',
    chords: [
      { chord: 'major' as ChordQuality, root: 'C' },
      { chord: 'major' as ChordQuality, root: 'G' },
      { chord: 'minor' as ChordQuality, root: 'A' },
      { chord: 'major' as ChordQuality, root: 'F' },
    ],
    progression: 'I-V-vi-IV',
  },
  {
    name: 'Autumn Leaves',
    artist: 'Jazz Standard',
    key: 'G',
    chords: [
      { chord: 'minor7' as ChordQuality, root: 'A' },
      { chord: 'dominant7' as ChordQuality, root: 'D' },
      { chord: 'major7' as ChordQuality, root: 'G' },
      { chord: 'major7' as ChordQuality, root: 'C' },
    ],
    progression: 'ii-V-I-IV (in major)',
  },
  {
    name: 'Blue Bossa',
    artist: 'Kenny Dorham',
    key: 'Cm',
    chords: [
      { chord: 'minor7' as ChordQuality, root: 'C' },
      { chord: 'minor7' as ChordQuality, root: 'F' },
      { chord: 'half_diminished7' as ChordQuality, root: 'D' },
      { chord: 'dominant7' as ChordQuality, root: 'G' },
    ],
    progression: 'i-iv-iiø-V',
  },
  {
    name: 'Sweet Home Alabama',
    artist: 'Lynyrd Skynyrd',
    key: 'D',
    chords: [
      { chord: 'major' as ChordQuality, root: 'D' },
      { chord: 'major' as ChordQuality, root: 'C' },
      { chord: 'major' as ChordQuality, root: 'G' },
    ],
    progression: 'I-bVII-IV',
  },
];

export function SongAnalysis({ onClose }: SongAnalysisProps) {
  const [chordSequence, setChordSequence] = useState<ChordEntry[]>([]);
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedChord, setSelectedChord] = useState<ChordQuality>('major');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Synchronous flag used by the playSequence loop. The isPlaying state is
  // captured by useCallback's closure, so it would still read `false` on the
  // very first iteration and break out before any chord plays.
  const isPlayingRef = useRef(false);

  const addChord = useCallback(() => {
    const newChord: ChordEntry = {
      id: `chord_${Date.now()}`,
      chord: selectedChord,
      rootNote: selectedRoot,
      duration: 1,
    };
    setChordSequence(prev => [...prev, newChord]);
    setAnalysisResult(null);
  }, [selectedRoot, selectedChord]);

  const removeChord = useCallback((id: string) => {
    setChordSequence(prev => prev.filter(c => c.id !== id));
    setAnalysisResult(null);
  }, []);

  const loadSongTemplate = useCallback((song: typeof COMMON_SONGS[0]) => {
    const entries: ChordEntry[] = song.chords.map((c, i) => ({
      id: `template_${i}_${Date.now()}`,
      chord: c.chord,
      rootNote: c.root,
      duration: 1,
    }));
    setChordSequence(entries);
    setAnalysisResult(`This is the ${song.progression} progression commonly used in "${song.name}"`);
  }, []);

  const getMidiNote = (root: string): number => {
    const noteIndex = ROOT_NOTES.indexOf(root);
    return 60 + noteIndex; // C4 = 60
  };

  const playSequence = useCallback(async () => {
    if (chordSequence.length === 0) return;

    getAudioContext();
    isPlayingRef.current = true;
    setIsPlaying(true);

    for (let i = 0; i < chordSequence.length; i++) {
      if (!isPlayingRef.current) break;

      setCurrentPlayingIndex(i);
      const entry = chordSequence[i];
      const rootMidi = getMidiNote(entry.rootNote);
      const notes = getChordNotes(rootMidi, entry.chord);

      playChord(notes, 'piano', 1.2, 0.6, false);

      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentPlayingIndex(-1);
  }, [chordSequence]);

  const stopPlayback = useCallback(() => {
    stopAllSounds();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentPlayingIndex(-1);
  }, []);

  const playIndividualChord = useCallback((entry: ChordEntry) => {
    getAudioContext();
    const rootMidi = getMidiNote(entry.rootNote);
    const notes = getChordNotes(rootMidi, entry.chord);
    playChord(notes, 'piano', 1.5, 0.6, false);
  }, []);

  const analyzeProgression = useCallback(() => {
    if (chordSequence.length < 2) {
      setAnalysisResult('Add at least 2 chords to analyze the progression.');
      return;
    }

    // Try to detect known progressions
    const chordPattern = chordSequence.map(c => `${c.rootNote}${CHORD_TYPES[c.chord].shortName}`).join('-');

    // Analyze the key based on the first chord (simplified)
    const possibleKey = chordSequence[0].rootNote;

    // Check for common patterns
    let analysis = `**Key Analysis:** Likely in the key of ${possibleKey}\n\n`;
    analysis += `**Chord Sequence:** ${chordPattern}\n\n`;

    // Detect specific patterns
    const hasMinorSeventh = chordSequence.some(c => c.chord === 'minor7');
    const hasDominantSeventh = chordSequence.some(c => c.chord === 'dominant7');
    const hasMajorSeventh = chordSequence.some(c => c.chord === 'major7');

    if (hasMinorSeventh && hasDominantSeventh && hasMajorSeventh) {
      analysis += `**Style:** This progression has jazz characteristics with ii-V-I elements.\n`;
    } else if (chordSequence.every(c => ['major', 'minor'].includes(c.chord))) {
      analysis += `**Style:** This is a classic pop/rock progression using triads.\n`;
    } else if (hasDominantSeventh && !hasMajorSeventh) {
      analysis += `**Style:** This has blues characteristics with dominant 7th chords.\n`;
    }

    // Voice leading analysis
    analysis += `\n**Voice Leading Tips:**\n`;
    for (let i = 0; i < chordSequence.length - 1; i++) {
      const current = chordSequence[i];
      const next = chordSequence[i + 1];
      const currentRoot = ROOT_NOTES.indexOf(current.rootNote);
      const nextRoot = ROOT_NOTES.indexOf(next.rootNote);
      const interval = (nextRoot - currentRoot + 12) % 12;

      if (interval === 7 || interval === 5) {
        analysis += `- ${current.rootNote} to ${next.rootNote}: Strong fifth motion (dominant relationship)\n`;
      } else if (interval === 2 || interval === 10) {
        analysis += `- ${current.rootNote} to ${next.rootNote}: Stepwise bass motion\n`;
      } else if (interval === 4 || interval === 8) {
        analysis += `- ${current.rootNote} to ${next.rootNote}: Third relationship (chromatic mediant)\n`;
      }
    }

    setAnalysisResult(analysis);
  }, [chordSequence]);

  const filteredSongs = COMMON_SONGS.filter(song =>
    song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bodyRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(true);

  // Swipe down to dismiss. The guard limits it to the top of the scroll area:
  // without it, flicking back up through a long list would close the sheet.
  const { ref: panelRef } = useSwipe<HTMLDivElement>({
    axis: 'vertical',
    onSwipeDown: onClose,
    shouldStart: () => (bodyRef.current?.scrollTop ?? 0) <= 0,
    thresholds: { distance: 80 },
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 safe-area-top safe-area-bottom">
      <Card
        ref={panelRef}
        className="w-full max-w-5xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col"
      >
        {/* Grab handle: the affordance for swipe-down-to-dismiss on touch. */}
        <div className="sm:hidden mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-white/30" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Music2 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Song Analysis</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid md:grid-cols-2 gap-4 p-4">
            {/* Left: Chord Builder */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Build Chord Progression
              </h3>

              {/* Chord selector */}
              <div className="bg-white/5 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Root Note</label>
                  <div className="flex flex-wrap gap-1">
                    {ROOT_NOTES.map(note => (
                      <button
                        key={note}
                        onClick={() => setSelectedRoot(note)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          selectedRoot === note
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Chord Type</label>
                  <select
                    value={selectedChord}
                    onChange={(e) => setSelectedChord(e.target.value as ChordQuality)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    {Object.entries(CHORD_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button onClick={addChord} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add {selectedRoot} {CHORD_TYPES[selectedChord].shortName}
                </Button>
              </div>

              {/* Chord sequence */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Your Progression</span>
                  <div className="flex gap-2">
                    {chordSequence.length > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={isPlaying ? stopPlayback : playSequence}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" onClick={analyzeProgression}>
                          <BookOpen className="w-4 h-4 mr-1" />
                          Analyze
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {chordSequence.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-4">
                    Add chords to build your progression
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {chordSequence.map((entry, index) => (
                      /* Stays a div rather than a button because it contains
                         the remove button below; the target check keeps that
                         nested button's keypresses from also playing the
                         chord. */
                      <div
                        key={entry.id}
                        role="button"
                        tabIndex={0}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                          currentPlayingIndex === index
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        onClick={() => playIndividualChord(entry)}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            playIndividualChord(entry);
                          }
                        }}
                      >
                        <span className="font-medium">
                          {entry.rootNote}{CHORD_TYPES[entry.chord].shortName}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeChord(entry.id);
                          }}
                          className="p-1 hover:bg-white/20 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analysis result */}
              {analysisResult && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-purple-300">Analysis</h4>
                  <div className="text-sm whitespace-pre-line text-white/80">
                    {analysisResult}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Song Templates */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="w-5 h-5" />
                Load Song Template
              </h3>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredSongs.map((song, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => loadSongTemplate(song)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadSongTemplate(song);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{song.name}</h4>
                        <p className="text-sm text-white/60">{song.artist}</p>
                      </div>
                      <Badge variant="info">Key: {song.key}</Badge>
                    </div>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {song.chords.map((c, i) => (
                        <Badge key={i} variant="purple" className="text-xs">
                          {c.root}{CHORD_TYPES[c.chord].shortName}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-white/40 mt-2">{song.progression}</p>
                  </div>
                ))}
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-300">Tips</h4>
                <ul className="text-sm text-white/70 space-y-1">
                  <li>- Click any chord to hear it</li>
                  <li>- Use the Play button to hear the full progression</li>
                  <li>- Load a song template to analyze famous progressions</li>
                  <li>- The analyzer detects key, style, and voice leading</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
