'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '회원가입 중 오류가 발생했습니다.');
        return;
      }

      // 회원가입 성공 → 로그인 페이지로 이동
      router.push('/login?registered=true');
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <p className="text-[var(--text-muted)]">Build Team Service 계정을 만드세요</p>
        </div>

        {/* Form */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-default)] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                아이디 <span className="text-red-400">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
                placeholder="3자 이상"
                required
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                이름 (표시명)
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                비밀번호 <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
                placeholder="8자 이상, 대소문자+숫자"
                required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                대문자, 소문자, 숫자를 포함해야 합니다
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                비밀번호 확인 <span className="text-red-400">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-cyan)] focus:outline-none transition-colors"
                placeholder="비밀번호 재입력"
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
                  가입 중...
                </span>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[var(--accent-cyan)] hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
