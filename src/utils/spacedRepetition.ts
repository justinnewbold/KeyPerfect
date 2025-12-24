// Spaced Repetition System for adaptive learning
// Based on SM-2 algorithm with modifications for ear training

export interface ReviewItem {
  id: string;
  type: 'chord' | 'scale' | 'interval';
  value: string;
  easeFactor: number; // 1.3 - 2.5
  interval: number; // Days until next review
  repetitions: number;
  nextReviewDate: number; // Timestamp
  lastReviewDate: number;
  correct: number;
  incorrect: number;
}

const STORAGE_KEY = 'keyperfect_srs';
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 2.5;
const DEFAULT_EASE_FACTOR = 2.0;

// Load SRS data from storage
export function loadSRSData(): Map<string, ReviewItem> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    }
  } catch (e) {
    console.error('Error loading SRS data:', e);
  }
  return new Map();
}

// Save SRS data to storage
function saveSRSData(data: Map<string, ReviewItem>) {
  try {
    const obj = Object.fromEntries(data.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error('Error saving SRS data:', e);
  }
}

// Create a new review item
function createReviewItem(
  type: 'chord' | 'scale' | 'interval',
  value: string
): ReviewItem {
  return {
    id: `${type}-${value}`,
    type,
    value,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewDate: Date.now(),
    lastReviewDate: 0,
    correct: 0,
    incorrect: 0,
  };
}

// Get or create a review item
export function getOrCreateItem(
  type: 'chord' | 'scale' | 'interval',
  value: string
): ReviewItem {
  const data = loadSRSData();
  const id = `${type}-${value}`;

  if (data.has(id)) {
    return data.get(id)!;
  }

  const item = createReviewItem(type, value);
  data.set(id, item);
  saveSRSData(data);
  return item;
}

// Quality rating (0-5, higher is better)
// 0 - Complete failure
// 1 - Incorrect but recognized after seeing answer
// 2 - Incorrect
// 3 - Correct with difficulty
// 4 - Correct with hesitation
// 5 - Perfect recall

export function calculateQuality(
  isCorrect: boolean,
  responseTimeMs: number,
  streak: number
): number {
  if (!isCorrect) {
    return 2; // Incorrect
  }

  // Fast response with streak = perfect recall
  if (responseTimeMs < 2000 && streak >= 3) {
    return 5;
  }

  // Fast response = correct with confidence
  if (responseTimeMs < 3000) {
    return 4;
  }

  // Slower response = correct with hesitation
  return 3;
}

// Update review item based on performance
export function updateReviewItem(
  type: 'chord' | 'scale' | 'interval',
  value: string,
  isCorrect: boolean,
  responseTimeMs: number,
  streak: number = 0
): ReviewItem {
  const data = loadSRSData();
  const id = `${type}-${value}`;

  let item = data.get(id);
  if (!item) {
    item = createReviewItem(type, value);
  }

  const quality = calculateQuality(isCorrect, responseTimeMs, streak);

  // Update statistics
  if (isCorrect) {
    item.correct++;
  } else {
    item.incorrect++;
  }

  // SM-2 algorithm
  if (quality < 3) {
    // Failed - reset
    item.repetitions = 0;
    item.interval = 0;
  } else {
    // Passed
    if (item.repetitions === 0) {
      item.interval = 1;
    } else if (item.repetitions === 1) {
      item.interval = 3;
    } else {
      item.interval = Math.round(item.interval * item.easeFactor);
    }
    item.repetitions++;
  }

  // Update ease factor
  const newEaseFactor =
    item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  item.easeFactor = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEaseFactor));

  // Set next review date
  item.lastReviewDate = Date.now();
  item.nextReviewDate = Date.now() + item.interval * 24 * 60 * 60 * 1000;

  data.set(id, item);
  saveSRSData(data);

  return item;
}

// Get items due for review
export function getDueItems(
  type?: 'chord' | 'scale' | 'interval',
  limit: number = 20
): ReviewItem[] {
  const data = loadSRSData();
  const now = Date.now();

  const dueItems = Array.from(data.values())
    .filter(item => {
      if (type && item.type !== type) return false;
      return item.nextReviewDate <= now;
    })
    .sort((a, b) => a.nextReviewDate - b.nextReviewDate)
    .slice(0, limit);

  return dueItems;
}

// Get weak items (low accuracy or ease factor)
export function getWeakItems(
  type?: 'chord' | 'scale' | 'interval',
  limit: number = 10
): ReviewItem[] {
  const data = loadSRSData();

  const weakItems = Array.from(data.values())
    .filter(item => {
      if (type && item.type !== type) return false;
      const total = item.correct + item.incorrect;
      if (total < 3) return false; // Need enough data

      const accuracy = item.correct / total;
      return accuracy < 0.7 || item.easeFactor < 1.8;
    })
    .sort((a, b) => {
      const aAccuracy = a.correct / (a.correct + a.incorrect);
      const bAccuracy = b.correct / (b.correct + b.incorrect);
      return aAccuracy - bAccuracy; // Lowest accuracy first
    })
    .slice(0, limit);

  return weakItems;
}

// Get learning progress summary
export function getLearningProgress(): {
  total: number;
  mastered: number;
  learning: number;
  struggling: number;
  new: number;
} {
  const data = loadSRSData();

  let mastered = 0;
  let learning = 0;
  let struggling = 0;

  data.forEach(item => {
    const total = item.correct + item.incorrect;
    if (total === 0) return;

    const accuracy = item.correct / total;

    if (accuracy >= 0.9 && item.easeFactor >= 2.0 && item.interval >= 7) {
      mastered++;
    } else if (accuracy >= 0.6) {
      learning++;
    } else {
      struggling++;
    }
  });

  // Count new items (items that haven't been reviewed yet)
  const allChords = ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7'];
  const allScales = ['major', 'natural_minor', 'harmonic_minor', 'dorian', 'mixolydian'];
  const allIntervals = ['minor2', 'major2', 'minor3', 'major3', 'perfect4', 'perfect5', 'octave'];

  const reviewedIds = new Set(data.keys());
  let newCount = 0;

  allChords.forEach(c => {
    if (!reviewedIds.has(`chord-${c}`)) newCount++;
  });
  allScales.forEach(s => {
    if (!reviewedIds.has(`scale-${s}`)) newCount++;
  });
  allIntervals.forEach(i => {
    if (!reviewedIds.has(`interval-${i}`)) newCount++;
  });

  return {
    total: data.size + newCount,
    mastered,
    learning,
    struggling,
    new: newCount,
  };
}

// Generate adaptive practice session
export function generateAdaptivePractice(
  type: 'chord' | 'scale' | 'interval' | 'mixed',
  count: number = 10
): { type: 'chord' | 'scale' | 'interval'; value: string }[] {
  const items: { type: 'chord' | 'scale' | 'interval'; value: string }[] = [];

  // Priority: weak items > due items > random
  const types = type === 'mixed' ? ['chord', 'scale', 'interval'] as const : [type] as const;

  // Get weak and due items
  let weakItems: ReviewItem[] = [];
  let dueItems: ReviewItem[] = [];

  types.forEach(t => {
    weakItems = [...weakItems, ...getWeakItems(t as 'chord' | 'scale' | 'interval', 5)];
    dueItems = [...dueItems, ...getDueItems(t as 'chord' | 'scale' | 'interval', 5)];
  });

  // Add weak items (40% of session)
  const weakCount = Math.ceil(count * 0.4);
  weakItems.slice(0, weakCount).forEach(item => {
    items.push({ type: item.type, value: item.value });
  });

  // Add due items (40% of session)
  const dueCount = Math.ceil(count * 0.4);
  dueItems
    .filter(item => !items.some(i => i.type === item.type && i.value === item.value))
    .slice(0, dueCount)
    .forEach(item => {
      items.push({ type: item.type, value: item.value });
    });

  // Fill remaining with random items
  const allItems: { type: 'chord' | 'scale' | 'interval'; value: string }[] = [];

  if (type === 'chord' || type === 'mixed') {
    ['major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7'].forEach(v => {
      allItems.push({ type: 'chord', value: v });
    });
  }
  if (type === 'scale' || type === 'mixed') {
    ['major', 'natural_minor', 'harmonic_minor', 'dorian', 'mixolydian'].forEach(v => {
      allItems.push({ type: 'scale', value: v });
    });
  }
  if (type === 'interval' || type === 'mixed') {
    ['minor2', 'major2', 'minor3', 'major3', 'perfect4', 'perfect5', 'minor6', 'major6', 'octave'].forEach(v => {
      allItems.push({ type: 'interval', value: v });
    });
  }

  // Shuffle remaining items
  const remaining = allItems
    .filter(item => !items.some(i => i.type === item.type && i.value === item.value))
    .sort(() => Math.random() - 0.5);

  while (items.length < count && remaining.length > 0) {
    items.push(remaining.shift()!);
  }

  // Shuffle final list
  return items.sort(() => Math.random() - 0.5);
}

// Get recommendation for what to practice next
export function getPracticeRecommendation(): {
  type: 'chord' | 'scale' | 'interval';
  reason: string;
} {
  const chordDue = getDueItems('chord').length;
  const scaleDue = getDueItems('scale').length;
  const intervalDue = getDueItems('interval').length;

  const chordWeak = getWeakItems('chord').length;
  const scaleWeak = getWeakItems('scale').length;
  const intervalWeak = getWeakItems('interval').length;

  // Prioritize weak areas
  if (chordWeak >= scaleWeak && chordWeak >= intervalWeak && chordWeak > 0) {
    return { type: 'chord', reason: 'Focus on your weaker chord types' };
  }
  if (scaleWeak >= intervalWeak && scaleWeak > 0) {
    return { type: 'scale', reason: 'Focus on your weaker scales' };
  }
  if (intervalWeak > 0) {
    return { type: 'interval', reason: 'Focus on your weaker intervals' };
  }

  // Then due items
  if (chordDue >= scaleDue && chordDue >= intervalDue) {
    return { type: 'chord', reason: `${chordDue} chord reviews are due` };
  }
  if (scaleDue >= intervalDue) {
    return { type: 'scale', reason: `${scaleDue} scale reviews are due` };
  }

  return { type: 'interval', reason: `${intervalDue} interval reviews are due` };
}
