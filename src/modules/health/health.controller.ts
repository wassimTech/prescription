import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Vérifier l'état de l'API et la connectivité PostgreSQL" })
  @ApiResponse({
    status: 200,
    description: 'État du service et de la base de données',
    schema: {
      example: {
        status: 'ok',
        service: 'linkers-prescription-saas-api',
        timestamp: '2026-09-20T11:20:00.000Z',
        database: 'connected',
      },
    },
  })
  async check() {
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      service: 'linkers-prescription-saas-api',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
