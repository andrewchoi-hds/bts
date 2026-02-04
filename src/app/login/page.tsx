'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// NextAuth 에러 코드를 사용자 친화적 메시지로 변환
const errorMessages: Record<string, string> = {
  Configuration: '서버 설정 오류입니다. 잠시 후 다시 시도해주세요.',
  CredentialsSignin: '아이디 또는 비밀번호가 올바르지 않습니다.',
  Default: '로그인 중 오류가 발생했습니다.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // URL에서 에러 파라미터 처리
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(errorMessages[urlError] || errorMessages.Default);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(errorMessages[result.error] || errorMessages.Default);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-default)] p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            아이디
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
            placeholder="아이디 입력"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary py-3 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              로그인 중...
            </span>
          ) : (
            '로그인'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-[var(--accent-cyan)] hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              BTS
            </span>
          </div>
          <p className="text-[var(--text-muted)]">Build Team Service에 로그인하세요</p>
        </div>

        {/* Form with Suspense */}
        <Suspense fallback={
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-default)] p-8">
            <div className="animate-pulse space-y-5">
              <div className="h-10 bg-[var(--bg-tertiary)] rounded-xl" />
              <div className="h-10 bg-[var(--bg-tertiary)] rounded-xl" />
              <div className="h-12 bg-[var(--bg-tertiary)] rounded-xl" />
            </div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
