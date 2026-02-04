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

function createPrismaClient() {
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
