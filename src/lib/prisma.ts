/**
 * Prisma Client 싱글톤 인스턴스
 *
 * Prisma 7+ requires adapter for direct database connection
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // URL에서 schema 파라미터 추출
  const url = new URL(connectionString);
  const schema = url.searchParams.get('schema') || 'public';

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  // 연결 시 search_path 설정
  pool.on('connect', (client) => {
    client.query(`SET search_path TO "${schema}"`);
  });

  const adapter = new PrismaPg(pool, { schema });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// 빌드 시점 감지 (NEXT_PHASE가 'phase-production-build'일 때)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build';

// 런타임에 prisma 클라이언트를 가져오는 함수
export function getPrisma(): PrismaClient {
  if (isBuildTime) {
    throw new Error('Prisma client should not be accessed during build');
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// 지연 초기화를 위한 프록시
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // 빌드 시점에는 더미 반환
    if (isBuildTime) {
      return () => Promise.resolve(null);
    }

    const client = getPrisma();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    // 함수인 경우 this 바인딩 유지
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
