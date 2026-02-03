'use client';

import GoalInput from './GoalInput';
import type { AIModel } from '@/types';

interface HomeViewProps {
  onStartCollaboration: (goal: string, model: AIModel) => void;
}

export default function HomeView({ onStartCollaboration }: HomeViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center overflow-y-auto overscroll-contain">
      <GoalInput onSubmit={onStartCollaboration} />
    </div>
  );
}
