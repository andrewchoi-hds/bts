/**
 * NextAuth.js API Route Handler
 */

import { handlers } from '@/lib/auth';

// Prisma는 Edge runtime에서 동작하지 않으므로 Node.js runtime 사용
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
