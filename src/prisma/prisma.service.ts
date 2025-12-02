import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'src/generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. PostgreSQL bağlantı havuzunu (Pool) oluştur
    const connectionString = `${process.env.DATABASE_URL}`;

    const pool = new Pool({
      connectionString,
    });

    // 2. Prisma Adapter'ı oluştur
    const adapter = new PrismaPg(pool);

    // 3. super() ile adapter'ı PrismaClient'a gönder
    super({ adapter });
  }

  async onModuleInit() {
    // Adapter kullanıldığında $connect çağrısı bazen opsiyoneldir
    // ama bağlantıyı başlatmak için burada tutabiliriz.
    await this.$connect();
  }
}
