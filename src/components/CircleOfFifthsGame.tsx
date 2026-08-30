import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Volume2, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useAudio } from '../hooks/useAudio';

// ─── Circle of Fifths Data ─────────────────────────────────────────────────

const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'] as const;
const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'] as const;
type MajorKey = typeof MAJOR_KEYS[number];
type MinorKey = typeof MINOR_KEYS[number];

const MAJOR_SET = new Set<string>(MAJOR_KEYS);
const MINOR_SET = new Set<string>(MINOR_KEYS);

const KEY_SIGNATURES: Record<MajorKey, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5,
  'F#': 6, Db: -5, Ab: -4, Eb: -3, Bb: -2, F: -1,
};

const KEY_MIDI_ROOTS: Record<MajorKey, number> = {
  C: 60, G: 67, D: 62, A: 69, E: 64, B: 71,
  'F#': 66, Db: 61, Ab: 68, Eb: 63, Bb: 70, F: 65,
};

// ─── SVG Geometry Helpers ──────────────────────────────────────────────────

const CX = 160;
const CY = 160;
const OUTER_R = 148;
const MID_R = 100;
const INNER_R = 58;

const toRad = (deg: number) => (deg * Math.PI) / 180;

function wedgePath(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number): string {
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const x1 = cx + r2 * Math.cos(s), y1 = cy + r2 * Math.sin(s);
  const x2 = cx + r2 * Math.cos(e), y2 = cy + r2 * Math.sin(e);
  const x3 = cx + r1 * Math.cos(e), y3 = cy + r1 * Math.sin(e);
  const x4 = cx + r1 * Math.cos(s), y4 = cy + r1 * Math.sin(s);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r2} ${r2} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} A${r1} ${r1} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)}Z`;
}

function labelAt(cx: number, cy: number, r: number, angleDeg: number) {
  return { x: cx + r * Math.cos(toRad(angleDeg)), y: cy + r * Math.sin(toRad(angleDeg)) };
}

// Rainbow color per position (hue 0-330 step 30), muted for dark UI
function keyHue(index: number) { return index * 30; }
function defaultFill(index: number, alpha: number) {
  return `hsla(${keyHue(index)}, 60%, 35%, ${alpha})`;
}
function hoverFill(index: number) {
  return `hsla(${keyHue(index)}, 75%, 55%, 0.85)`;
}

// ─── Question Types ────────────────────────────────────────────────────────

type QuestionType = 'identify_key' | 'relative_minor' | 'key_signature' | 'fifth_above' | 'fifth_below';
type AnswerRing = 'major' | 'minor';

interface Question {
  type: QuestionType;
  text: string;
  subtext?: string;
  correctAnswer: string;
  referenceKey?: MajorKey;
  answerRing: AnswerRing;
  audioNotes?: number[];
}

function generateQuestion(qIndex: number): Question {
  const types: QuestionType[] = [
    'identify_key',
    'relative_minor',
    'key_signature',
    'fifth_above',
    'fifth_below',
  ];
  const type = types[qIndex % types.length];
  const ki = Math.floor(Math.random() * 12);
  const key = MAJOR_KEYS[ki];

  switch (type) {
    case 'identify_key': {
      const root = KEY_MIDI_ROOTS[key];
      return {
        type,
        text: 'Which key is this chord from?',
        subtext: 'Listen and click the matching key',
        correctAnswer: key,
        answerRing: 'major',
        audioNotes: [root, root + 4, root + 7],
      };
    }
    case 'relative_minor':
      return {
        type,
        text: `Relative minor of ${key} major?`,
        subtext: 'Click the inner ring',
        correctAnswer: MINOR_KEYS[ki],
        referenceKey: key,
        answerRing: 'minor',
      };
    case 'key_signature': {
      const sigs = KEY_SIGNATURES[key];
      const sigText =
        sigs === 0 ? 'no sharps or flats'
        : sigs > 0 ? `${sigs} sharp${sigs !== 1 ? 's' : ''}`
        : `${Math.abs(sigs)} flat${Math.abs(sigs) !== 1 ? 's' : ''}`;
      return {
        type,
        text: `Which key has ${sigText}?`,
        correctAnswer: key,
        answerRing: 'major',
      };
    }
    case 'fifth_above': {
      const nextKey = MAJOR_KEYS[(ki + 1) % 12];
      return {
        type,
        text: `A perfect 5th above ${key}?`,
        subtext: 'Click the next key clockwise',
        correctAnswer: nextKey,
        referenceKey: key,
        answerRing: 'major',
      };
    }
    case 'fifth_below': {
      const prevKey = MAJOR_KEYS[(ki + 11) % 12];
      return {
        type,
        text: `A perfect 5th below ${key}?`,
        subtext: 'Click the next key counter-clockwise',
        correctAnswer: prevKey,
        referenceKey: key,
        answerRing: 'major',
      };
    }
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

interface CircleOfFifthsGameProps {
  onBack: () => void;
}

const TOTAL_QUESTIONS = 15;

export function CircleOfFifthsGame({ onBack }: CircleOfFifthsGameProps) {
  const audio = useAudio();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(0));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [phase, setPhase] = useState<'answering' | 'feedback' | 'finished'>('answering');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Auto-play audio for ear-training questions
  useEffect(() => {
    if (question.type === 'identify_key' && question.audioNotes && phase === 'answering') {
      const t = setTimeout(() => audio.playChord(question.audioNotes!), 400);
      return () => clearTimeout(t);
    }
  }, [question, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const canClick = useCallback(
    (key: string) => {
      if (phase !== 'answering') return false;
      if (key === question.referenceKey) return false;
      return question.answerRing === 'major' ? MAJOR_SET.has(key) : MINOR_SET.has(key);
    },
    [phase, question],
  );

  const handleSegmentClick = useCallback(
    (key: string) => {
      if (!canClick(key)) return;
      const correct = key === question.correctAnswer;
      setSelectedAnswer(key);
      setIsCorrect(correct);
      setPhase('feedback');
      setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
      setStreak(s => (correct ? s + 1 : 0));
      if (correct) audio.playSuccess();
      else audio.playError();
    },
    [canClick, question.correctAnswer, audio],
  );

  const handleNext = useCallback(() => {
    const next = questionIndex + 1;
    if (next >= TOTAL_QUESTIONS) {
      setPhase('finished');
    } else {
      setQuestionIndex(next);
      setQuestion(generateQuestion(next));
      setSelectedAnswer(null);
      setIsCorrect(null);
      setPhase('answering');
    }
  }, [questionIndex]);

  const handleRestart = useCallback(() => {
    setQuestionIndex(0);
    setQuestion(generateQuestion(0));
    setSelectedAnswer(null);
    setIsCorrect(null);
    setPhase('answering');
    setScore({ correct: 0, total: 0 });
    setStreak(0);
  }, []);

  // ─── Segment appearance helpers ─────────────────────────────────────────

  function getSegmentFill(key: string, index: number, ring: 'major' | 'minor'): string {
    const isSelected = selectedAnswer === key;
    const isReference = key === question.referenceKey;
    const isCorrectAnswer = key === question.correctAnswer;

    if (phase === 'feedback') {
      if (isSelected && isCorrect) return '#22c55e';
      if (isSelected && !isCorrect) return '#ef4444';
      if (isCorrectAnswer) return '#22c55e';
      if (isReference) return '#f59e0b';
    }
    if (phase === 'answering' && isReference) return '#f59e0b80';
    if (hoveredKey === key && canClick(key)) return hoverFill(index);
    const alpha = ring === 'major' ? 0.45 : 0.35;
    return defaultFill(index, alpha);
  }

  function getSegmentOpacity(key: string): number {
    if (phase !== 'answering') return 1;
    if (key === question.referenceKey) return 1;
    if (question.answerRing === 'major' && MINOR_SET.has(key)) return 0.3;
    if (question.answerRing === 'minor' && MAJOR_SET.has(key)) return 0.3;
    return 1;
  }

  // ─── Finished screen ─────────────────────────────────────────────────────

  if (phase === 'finished') {
    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const emoji = accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪';
    return (
      <div className="screen-root flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="text-6xl">{emoji}</div>
          <h2 className="text-2xl font-bold gradient-text">Round Complete!</h2>
          <Card className="p-6">
            <div className="text-5xl font-bold text-purple-400 mb-1">{accuracy}%</div>
            <div className="text-sm text-white/60 mb-4">Accuracy</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-400">{score.correct}</div>
                <div className="text-xs text-white/60">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{score.total - score.correct}</div>
                <div className="text-xs text-white/60">Incorrect</div>
              </div>
            </div>
          </Card>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onBack} className="flex-1">Home</Button>
            <Button variant="primary" onClick={handleRestart} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Game screen ──────────────────────────────────────────────────────────

  return (
    <div className="screen-root flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button onClick={onBack} className="tap-target rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-white/70">Circle of Fifths</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/50">{questionIndex + 1}/{TOTAL_QUESTIONS}</span>
          <span className="font-semibold text-green-400">{score.correct}/{score.total || '—'}</span>
          {streak >= 3 && <span className="text-amber-400">🔥{streak}</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${(questionIndex / TOTAL_QUESTIONS) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="px-4 text-center mb-2">
        <h2 className="text-xl font-bold leading-snug">{question.text}</h2>
        {question.subtext && (
          <p className="text-sm text-white/50 mt-1">{question.subtext}</p>
        )}
        {question.type === 'identify_key' && phase === 'answering' && (
          <button
            onClick={() => audio.playChord(question.audioNotes!)}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 transition-colors text-sm"
          >
            <Volume2 className="w-4 h-4" />
            Play chord again
          </button>
        )}
      </div>

      {/* Wheel */}
      <div className="flex-1 flex items-center justify-center px-3 py-2">
        <div className="w-full" style={{ maxWidth: 360, maxHeight: 360 }}>
          <svg viewBox="0 0 320 320" width="100%" height="100%">

            {/* Major key ring */}
            {MAJOR_KEYS.map((key, i) => {
              const mid = -90 + i * 30;
              const path = wedgePath(CX, CY, MID_R + 2, OUTER_R, mid - 15, mid + 15);
              const lp = labelAt(CX, CY, (OUTER_R + MID_R) / 2, mid);
              const fill = getSegmentFill(key, i, 'major');
              const opacity = getSegmentOpacity(key);
              const clickable = canClick(key);

              return (
                <g
                  key={`major-${key}`}
                  style={{ cursor: clickable ? 'pointer' : 'default', opacity }}
                  onClick={() => handleSegmentClick(key)}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  <path
                    d={path}
                    fill={fill}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    style={{ transition: 'fill 0.15s ease' }}
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={key.length > 2 ? '9' : '12'}
                    fontWeight="700"
                    fill="white"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {key}
                  </text>
                </g>
              );
            })}

            {/* Minor key ring */}
            {MINOR_KEYS.map((key, i) => {
              const mid = -90 + i * 30;
              const path = wedgePath(CX, CY, INNER_R + 2, MID_R - 2, mid - 15, mid + 15);
              const lp = labelAt(CX, CY, (MID_R + INNER_R) / 2, mid);
              const fill = getSegmentFill(key, i, 'minor');
              const opacity = getSegmentOpacity(key);
              const clickable = canClick(key);

              return (
                <g
                  key={`minor-${key}`}
                  style={{ cursor: clickable ? 'pointer' : 'default', opacity }}
                  onClick={() => handleSegmentClick(key)}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  <path
                    d={path}
                    fill={fill}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    style={{ transition: 'fill 0.15s ease' }}
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={key.length > 3 ? '7' : '9'}
                    fontWeight="500"
                    fill="rgba(255,255,255,0.85)"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {key}
                  </text>
                </g>
              );
            })}

            {/* Center circle */}
            <circle
              cx={CX}
              cy={CY}
              r={INNER_R - 2}
              fill="rgba(12,10,35,0.92)"
              stroke="rgba(167,139,250,0.35)"
              strokeWidth="1.5"
            />

            {/* Center content */}
            {phase === 'feedback' ? (
              <>
                <text
                  x={CX}
                  y={CY - 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="24"
                  fill={isCorrect ? '#22c55e' : '#ef4444'}
                  style={{ userSelect: 'none' }}
                >
                  {isCorrect ? '✓' : '✗'}
                </text>
                <text
                  x={CX}
                  y={CY + 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fill="rgba(255,255,255,0.75)"
                  style={{ userSelect: 'none' }}
                >
                  {isCorrect ? 'Correct!' : question.correctAnswer}
                </text>
              </>
            ) : (
              <>
                <text
                  x={CX}
                  y={CY - 9}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  fill="rgba(255,255,255,0.4)"
                  style={{ userSelect: 'none' }}
                >
                  Circle of
                </text>
                <text
                  x={CX}
                  y={CY + 9}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  fill="rgba(255,255,255,0.4)"
                  style={{ userSelect: 'none' }}
                >
                  Fifths
                </text>
              </>
            )}

            {/* Ring labels */}
            <text
              x={CX}
              y={CY - OUTER_R - 6}
              textAnchor="middle"
              fontSize="7"
              fill="rgba(255,255,255,0.3)"
              style={{ userSelect: 'none' }}
            >
              MAJOR
            </text>
            <text
              x={CX}
              y={CY - MID_R + 13}
              textAnchor="middle"
              fontSize="6"
              fill="rgba(255,255,255,0.2)"
              style={{ userSelect: 'none' }}
            >
              MINOR
            </text>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 flex items-center justify-center gap-4 text-xs text-white/40 mb-2">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
          Outer = Major keys
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
          Inner = Relative minors
        </span>
        {question.referenceKey && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Reference
          </span>
        )}
      </div>

      {/* Feedback + Next */}
      <div className="px-4 pb-8 pt-1">
        {phase === 'feedback' ? (
          <div className="space-y-3">
            <div
              className={`p-3 rounded-xl text-center ${
                isCorrect
                  ? 'bg-green-500/20 border border-green-500/40'
                  : 'bg-red-500/20 border border-red-500/40'
              }`}
            >
              <p className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correct!' : `Incorrect — Answer: ${question.correctAnswer}`}
              </p>
              {!isCorrect && selectedAnswer && (
                <p className="text-xs text-white/60 mt-1">You selected: {selectedAnswer}</p>
              )}
            </div>
            <Button variant="primary" onClick={handleNext} className="w-full">
              {questionIndex + 1 >= TOTAL_QUESTIONS ? 'See Results' : 'Next Question'}
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs text-white/30">
            {question.answerRing === 'minor'
              ? 'Click the inner ring to answer'
              : 'Click the outer ring to answer'}
          </p>
        )}
      </div>
    </div>
  );
}
