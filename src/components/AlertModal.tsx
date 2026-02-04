'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// Alert 타입
interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// Confirm 타입
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error';
}

interface AlertContextType {
  alert: (options: AlertOptions | string) => Promise<void>;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}

interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  options: AlertOptions | ConfirmOptions;
  resolve: ((value: boolean | void) => void) | null;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    options: { message: '' },
    resolve: null,
  });

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        type: 'alert',
        options: typeof options === 'string' ? { message: options } : options,
        resolve: () => resolve(),
      });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        type: 'confirm',
        options: typeof options === 'string' ? { message: options } : options,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (modal.resolve) {
      modal.resolve(result);
    }
    setModal((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [modal.resolve]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal.isOpen) {
        // confirm은 취소, alert는 확인으로 처리
        handleClose(modal.type === 'alert');
      }
    };

    if (modal.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 모달 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modal.isOpen, modal.type, handleClose]);

  const getTypeStyles = (type?: string) => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          iconBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-400',
          buttonBg: 'bg-emerald-500 hover:bg-emerald-600',
        };
      case 'warning':
        return {
          icon: '!',
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-400',
          buttonBg: 'bg-amber-500 hover:bg-amber-600',
        };
      case 'error':
        return {
          icon: '✕',
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-400',
          buttonBg: 'bg-red-500 hover:bg-red-600',
        };
      default:
        return {
          icon: 'i',
          iconBg: 'bg-[var(--accent-cyan)]/20',
          iconColor: 'text-[var(--accent-cyan)]',
          buttonBg: 'bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/80',
        };
    }
  };

  const styles = getTypeStyles(modal.options.type);

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}

      {/* Modal Backdrop */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => modal.type === 'alert' && handleClose(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-default)] shadow-2xl animate-scaleIn">
            <div className="p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-14 h-14 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                  <span className={`text-2xl font-bold ${styles.iconColor}`}>{styles.icon}</span>
                </div>
              </div>

              {/* Title */}
              {modal.options.title && (
                <h3 className="text-lg font-semibold text-center mb-2">
                  {modal.options.title}
                </h3>
              )}

              {/* Message */}
              <p className="text-[var(--text-secondary)] text-center whitespace-pre-line leading-relaxed">
                {modal.options.message}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              {modal.type === 'confirm' && (
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium transition-colors"
                >
                  {(modal.options as ConfirmOptions).cancelText || '취소'}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className={`flex-1 py-3 px-4 rounded-xl text-white font-medium transition-colors ${styles.buttonBg}`}
              >
                {modal.options.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
