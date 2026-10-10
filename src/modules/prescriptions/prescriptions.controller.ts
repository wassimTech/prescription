import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserProfileDto } from '@/modules/auth/dto/auth-response.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('Prescriptions')
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESCRIBER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new prescription' })
  @ApiResponse({
    status: 201,
    description: 'Prescription created successfully',
    type: PrescriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires PRESCRIBER role',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Prescriber profile not found',
  })
  async create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @CurrentUser() user: UserProfileDto,
  ): Promise<PrescriptionResponseDto> {
    return this.prescriptionsService.create(createPrescriptionDto, user.id);
  }
}
