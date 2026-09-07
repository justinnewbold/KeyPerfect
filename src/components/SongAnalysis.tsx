import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Music2, Play, Pause, Plus, Search, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { useSwipe } from '../hooks/useSwipe';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
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
  /*
   * `status` exists so Analyze always changes something the user can see.
   * Previously the only outcome was a string appended to the bottom of a tall
   * column inside the sheet's own scroller, so a successful analysis looked
   * exactly like a dead button.
   */
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const shouldRevealResult = useRef(false);
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
    setStatus('idle');
  }, [selectedRoot, selectedChord]);

  const removeChord = useCallback((id: string) => {
    setChordSequence(prev => prev.filter(c => c.id !== id));
    setAnalysisResult(null);
    setStatus('idle');
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
    setStatus('ready');
    shouldRevealResult.current = true;
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
    shouldRevealResult.current = true;

    if (chordSequence.length < 2) {
      setAnalysisResult('Add at least 2 chords to analyze the progression.');
      setStatus('empty');
      return;
    }

    setStatus('loading');

    try {
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
      setStatus('ready');
    } catch (err) {
      // A malformed entry (an unknown chord quality from an imported set, say)
      // must surface as a retryable failure, not a silently unchanged panel.
      console.error('Progression analysis failed:', err);
      setAnalysisResult(null);
      setStatus('error');
    }
  }, [chordSequence]);

  const filteredSongs = COMMON_SONGS.filter(song =>
    song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /*
   * Bring the panel into view once it has actually rendered. The sheet body is
   * its own scroll container, so the result can be hundreds of pixels below the
   * fold with nothing on screen changing when Analyze succeeds.
   */
  useEffect(() => {
    if (!shouldRevealResult.current) return;
    if (status === 'idle' || status === 'loading') return;
    shouldRevealResult.current = false;
    resultRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    resultRef.current?.focus({ preventScroll: true });
  }, [status, analysisResult]);

  useBodyScrollLock(true);

  /*
   * Swipe down to dismiss, attached to the handle and header rather than the
   * whole sheet. That surface carries `touch-none`, which is what makes the
   * gesture work at all: with the default touch-action the browser claims a
   * vertical drag for scrolling and cancels the pointer stream mid-gesture.
   * Claiming the whole panel that way would kill scrolling in the body, so
   * the sheet is dragged by its header, as bottom sheets normally are.
   */
  const { ref: dragHandleRef } = useSwipe<HTMLDivElement>({
    axis: 'vertical',
    onSwipeDown: onClose,
    thresholds: { distance: 60 },
  });

  const panelRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 safe-area-top safe-area-bottom">
      <Card
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-analysis-title"
        tabIndex={-1}
        className="w-full max-w-5xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col focus:outline-none"
      >
        <div ref={dragHandleRef} className="touch-none shrink-0">
          {/* Grab handle: the affordance for swipe-down-to-dismiss on touch. */}
          <div className="sm:hidden mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-white/30" />
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Music2 className="w-6 h-6 text-purple-400" />
              <h2 id="song-analysis-title" className="text-xl font-bold">Song Analysis</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close Song Analysis" className="tap-target rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
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
                  <span id="sa-root-label" className="block text-sm font-medium mb-2">Root Note</span>
                  <div className="flex flex-wrap gap-1" role="group" aria-labelledby="sa-root-label">
                    {ROOT_NOTES.map(note => (
                      <button
                        key={note}
                        type="button"
                        aria-label={`Root note ${note}`}
                        aria-pressed={selectedRoot === note}
                        onClick={() => setSelectedRoot(note)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                          selectedRoot === note
                            ? 'bg-purple-700 text-white'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="sa-chord-type" className="block text-sm font-medium mb-2">Chord Type</label>
                  <select
                    id="sa-chord-type"
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

                <Button
                  onClick={addChord}
                  className="w-full"
                  aria-label={`Add ${selectedRoot} ${CHORD_TYPES[selectedChord].name} to the progression`}
                >
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
                          aria-label={isPlaying ? 'Stop progression playback' : 'Play progression'}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={analyzeProgression}
                          disabled={status === 'loading'}
                          aria-label="Analyze progression"
                        >
                          {status === 'loading'
                            ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            : <BookOpen className="w-4 h-4 mr-1" />}
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
                    {chordSequence.map((entry, index) => {
                      const label = `${entry.rootNote} ${CHORD_TYPES[entry.chord].name}`;
                      return (
                        /*
                          Play and remove are siblings inside a plain wrapper.
                          They used to be a button nested inside a role=button
                          div, which is both an ARIA violation and a coin toss
                          about which one a press lands on.
                        */
                        <div
                          key={entry.id}
                          className={`flex items-center rounded-lg transition-colors ${
                            currentPlayingIndex === index
                              ? 'bg-purple-700 text-white'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          <button
                            type="button"
                            aria-label={`Play ${label}`}
                            onClick={() => playIndividualChord(entry)}
                            className="px-3 py-2 font-medium rounded-l-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                          >
                            {entry.rootNote}{CHORD_TYPES[entry.chord].shortName}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${label} from the progression`}
                            onClick={() => removeChord(entry.id)}
                            className="p-2 pr-3 rounded-r-lg hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Analysis result. Always rendered once Analyze has run, so
                  loading, empty and failed all land somewhere visible rather
                  than leaving the button looking inert. */}
              {status !== 'idle' && (
                <div
                  ref={resultRef}
                  data-testid="analysis-result"
                  role="status"
                  aria-live="polite"
                  aria-busy={status === 'loading'}
                  tabIndex={-1}
                  className={`rounded-lg p-4 border scroll-mt-4 focus:outline-none ${
                    status === 'error'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-purple-500/10 border-purple-500/30'
                  }`}
                >
                  {status === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing progression…
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-red-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Couldn't analyze this progression
                      </h4>
                      <p className="text-sm text-white/70">
                        Something in the sequence wasn't recognised. Try removing the most
                        recent chord, or start again with a song template.
                      </p>
                      <Button size="sm" variant="secondary" onClick={analyzeProgression}>
                        Retry analysis
                      </Button>
                    </div>
                  )}

                  {status === 'empty' && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-purple-300">Nothing to analyze yet</h4>
                      <p className="text-sm text-white/70">{analysisResult}</p>
                    </div>
                  )}

                  {status === 'ready' && analysisResult && (
                    <>
                      <h4 className="font-semibold mb-2 text-purple-300">Analysis</h4>
                      <div className="text-sm whitespace-pre-line text-white/80">
                        {renderEmphasis(analysisResult)}
                      </div>
                    </>
                  )}
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
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                  aria-label="Search song templates"
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredSongs.length === 0 && (
                  <p className="text-sm text-white/50 text-center py-6">
                    No songs match "{searchQuery}". Clear the search to see all templates.
                  </p>
                )}
                {filteredSongs.map((song, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Load ${song.name} by ${song.artist}, ${song.progression} in ${song.key}`}
                    className="w-full text-left bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    onClick={() => loadSongTemplate(song)}
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
                  </button>
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

/**
 * The analysis text is assembled with `**bold**` markers. They were being
 * printed literally, so the finished panel read "**Key Analysis:** Likely in
 * the key of C". This turns the marked runs into real emphasis without
 * pulling in a Markdown renderer for two asterisks.
 */
function renderEmphasis(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}
