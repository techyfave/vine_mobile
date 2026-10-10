/**
 * Vine motion system. Every animation in the app uses these tokens so movement feels like one
 * product: the same three speeds, one easing curve, one spring.
 *
 * - fast: taps and small state changes (press, like, toggles)
 * - base: things appearing or moving (cards, steps, sheets)
 * - slow: big, rare moments (first screen reveal)
 *
 * All presets follow the phone's "reduce motion" setting (ReduceMotion.System).
 */
import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
  ZoomIn,
} from 'react-native-reanimated';

export const duration = { fast: 160, base: 280, slow: 450 } as const;

/** Quick start, gentle settle. */
export const easing = Easing.bezier(0.2, 0, 0, 1);

export const timing = (ms: number = duration.base): WithTimingConfig => ({
  duration: ms,
  easing,
  reduceMotion: ReduceMotion.System,
});

/** Snappy, barely-there overshoot: presses, pops. */
export const spring: WithSpringConfig = { damping: 18, stiffness: 260, mass: 0.9, reduceMotion: ReduceMotion.System };

/** How far apart list items start when they appear one after another. */
export const STAGGER = 45;
const MAX_STAGGERED = 6;
export const staggerDelay = (index: number) => Math.min(index, MAX_STAGGERED) * STAGGER;

const sys = ReduceMotion.System;

export const enter = {
  /** Default for content appearing: a short rise with a fade. */
  rise: (delay = 0) => FadeInDown.duration(duration.base).easing(easing).delay(delay).reduceMotion(sys),
  /** Larger rise for a screen's main surface on first reveal. */
  reveal: (delay = 0) => FadeInDown.duration(duration.slow).easing(easing).delay(delay).reduceMotion(sys),
  fade: (delay = 0) => FadeIn.duration(duration.base).easing(easing).delay(delay).reduceMotion(sys),
  /** Moving forward through steps / slides. */
  forward: () => FadeInRight.duration(duration.base).easing(easing).reduceMotion(sys),
  /** Moving back through steps / slides. */
  back: () => FadeInLeft.duration(duration.base).easing(easing).reduceMotion(sys),
  /** Dialogs and modals. */
  pop: () => ZoomIn.springify().damping(spring.damping!).stiffness(spring.stiffness!).reduceMotion(sys),
} as const;

export const exit = {
  fade: () => FadeOut.duration(duration.fast).easing(easing).reduceMotion(sys),
} as const;

/** Siblings sliding into place when something above them appears, disappears or resizes. */
export const layout = LinearTransition.duration(duration.base).easing(easing).reduceMotion(sys);
