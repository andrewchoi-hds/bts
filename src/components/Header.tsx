'use client';

interface HeaderProps {
  currentStep: number;
  onReset?: () => void;
}

export default function Header({ currentStep, onReset }: HeaderProps) {
  const steps = [
    { num: 1, label: '목표', icon: '🎯' },
    { num: 2, label: '팀 구성', icon: '👥' },
    { num: 3, label: '협업', icon: '💬' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] via-[var(--accent-purple)] to-[var(--accent-pink)] p-[1px]">
            <div className="w-full h-full rounded-[10px] bg-[var(--bg-primary)] flex items-center justify-center">
              <span className="text-base font-bold gradient-text" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                B
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-jetbrains)' }}>
              BTS
            </h1>
          </div>
        </button>

        {/* Step Indicator - Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-[var(--bg-tertiary)]/50 rounded-full p-1">
          {steps.map((step, index) => (
            <div key={step.num} className="flex items-center">
              <button
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${
                  currentStep === step.num
                    ? 'bg-[var(--bg-primary)] shadow-md'
                    : 'hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                    currentStep === step.num
                      ? 'bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white'
                      : currentStep > step.num
                      ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]'
                      : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                  }`}
                  style={{ fontFamily: 'var(--font-jetbrains)' }}
                >
                  {currentStep > step.num ? '✓' : step.num}
                </span>
                <span className={`text-sm font-medium transition-colors ${
                  currentStep === step.num
                    ? 'text-[var(--text-primary)]'
                    : currentStep > step.num
                    ? 'text-[var(--accent-green)]'
                    : 'text-[var(--text-muted)]'
                }`}>
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-6 flex items-center justify-center">
                  <div
                    className={`w-4 h-[2px] rounded-full transition-colors ${
                      currentStep > step.num
                        ? 'bg-[var(--accent-green)]'
                        : 'bg-[var(--border-subtle)]'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Step Indicator - Mobile */}
        <div className="flex md:hidden items-center gap-2">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`w-2 h-2 rounded-full transition-all ${
                currentStep === step.num
                  ? 'w-6 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)]'
                  : currentStep > step.num
                  ? 'bg-[var(--accent-green)]'
                  : 'bg-[var(--bg-hover)]'
              }`}
            />
          ))}
        </div>

        {/* Spacer for balance */}
        <div className="w-9 sm:w-[72px]" />
      </div>
    </header>
  );
}
