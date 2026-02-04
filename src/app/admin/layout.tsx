import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 로그인하지 않았거나 관리자가 아닌 경우 리다이렉트
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex">
      <AdminNav />
      <main className="flex-1 overflow-auto bg-[var(--bg-primary)]">
        {children}
      </main>
    </div>
  );
}
