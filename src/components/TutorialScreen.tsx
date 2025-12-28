import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Play, Music, Target, Award, Headphones } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { useAudio } from '../hooks/useAudio';
import { PianoKeyboard } from './PianoKeyboard';
import { getChordNotes } from '../utils/gameHelpers';
import { updateSettings } from '../utils/storage';

interface TutorialScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  interactive?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to KeyPerfect!',
    description: 'Train your ears to recognize chords, scales, and intervals. This quick tutorial will show you how it works.',
    icon: <Music className="w-12 h-12" />,
  },
  {
    id: 'listen',
    title: 'Listen Carefully',
    description: 'Each question plays a musical sound. Listen closely and try to identify what you hear. Tap the play button to hear it again.',
    icon: <Headphones className="w-12 h-12" />,
    interactive: true,
  },
  {
    id: 'answer',
    title: 'Choose Your Answer',
    description: 'Select the answer you think is correct. Don\'t worry if you make mistakes - that\'s how you learn!',
    icon: <Target className="w-12 h-12" />,
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    description: 'Earn XP, unlock achievements, and level up as you improve. The more you practice, the better you\'ll get!',
    icon: <Award className="w-12 h-12" />,
  },
];

export function TutorialScreen({ onComplete, onSkip }: TutorialScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const audio = useAudio();

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      updateSettings({ showHints: true }); // Enable hints for new users
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
      setHasPlayedSound(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const playDemoChord = () => {
    const notes = getChordNotes(60, 'major'); // C major chord
    audio.playChord(notes);
    setHasPlayedSound(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-white/60">Tutorial</span>
        <button
          onClick={onSkip}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Progress */}
      <Progress
        value={currentStep + 1}
        max={TUTORIAL_STEPS.length}
        color="purple"
        size="sm"
        className="mb-8"
      />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            {step.icon}
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
          <p className="text-white/70 mb-6">{step.description}</p>

          {/* Interactive elements for specific steps */}
          {step.id === 'listen' && (
            <div className="mb-6">
              <button
                onClick={playDemoChord}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all ${
                  hasPlayedSound
                    ? 'bg-green-500/20 border-2 border-green-500'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                }`}
              >
                <Play className="w-6 h-6 ml-1" />
              </button>
              <p className="text-sm text-white/50 mt-2">
                {hasPlayedSound ? 'That was a C Major chord!' : 'Tap to play a chord'}
              </p>
            </div>
          )}

          {step.id === 'answer' && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {['Major', 'Minor', 'Diminished', 'Augmented'].map((option, index) => (
                <button
                  key={option}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    index === 0
                      ? 'bg-green-500/20 border-green-500 text-green-300'
                      : 'bg-white/10 border-white/20 text-white/70'
                  }`}
                >
                  <span className="text-xs text-white/40 mr-1">{index + 1}</span>
                  {option}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {currentStep > 0 && (
          <Button
            variant="secondary"
            onClick={handlePrev}
            icon={<ChevronLeft className="w-5 h-5" />}
          >
            Back
          </Button>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={handleNext}
          icon={<ChevronRight className="w-5 h-5" />}
        >
          {isLastStep ? 'Get Started' : 'Next'}
        </Button>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {TUTORIAL_STEPS.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentStep
                ? 'bg-purple-500 w-6'
                : index < currentStep
                ? 'bg-purple-500/50'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
