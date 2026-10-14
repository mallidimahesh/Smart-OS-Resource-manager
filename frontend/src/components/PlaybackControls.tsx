import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
} from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number; // in milliseconds per step (e.g. 1000 = 1x, 500 = 2x, 250 = 4x)
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSeek?: (step: number) => void;
  statusText?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  onSpeedChange,
  onSeek,
  statusText,
}) => {
  // Global keyboard shortcuts: Space (Play/Pause), Left/Right (Step), R (Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) onPause();
        else onPlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPlay, onPause, onNext, onPrev, onReset]);

  const speedOptions = [
    { label: '0.5x', value: 2000 },
    { label: '1x', value: 1000 },
    { label: '2x', value: 500 },
    { label: '4x', value: 250 },
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Main playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset to Step 0 (Key: R)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={onPrev}
            disabled={currentStep <= 0}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Previous Step (Key: Left Arrow)"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={currentStep >= totalSteps && !isPlaying}
            className={`flex items-center justify-center h-10 w-10 rounded-full font-bold shadow-lg transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
            } disabled:opacity-30`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onNext}
            disabled={currentStep >= totalSteps}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Next Step (Key: Right Arrow)"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Step Scrubber & Progress */}
        <div className="flex-1 w-full sm:max-w-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>
              Step <strong className="text-cyan-400">{currentStep}</strong> of {totalSteps}
            </span>
            {statusText && <span className="text-slate-400 truncate ml-2 max-w-[200px]">{statusText}</span>}
          </div>
          <input
            type="range"
            min={0}
            max={totalSteps}
            value={currentStep}
            onChange={(e) => onSeek && onSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-slate-400" />
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {speedOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => onSpeedChange(opt.value)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  speed === opt.value
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
        <span>Keyboard shortcuts: Space (Play/Pause) | ← / → (Step) | R (Reset)</span>
        <span className="text-cyan-400 font-medium">True State Rollback Enabled</span>
      </div>
    </div>
  );
};
