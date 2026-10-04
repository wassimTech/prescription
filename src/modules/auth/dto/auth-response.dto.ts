import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: 'cuid-or-uuid' })
  id!: string;

  @ApiProperty({ example: 'coach.karim@gmail.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PRESCRIBER })
  role!: UserRole;

  @ApiProperty({ example: '2026-09-20T12:00:00.000Z' })
  createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: "JWT access token à fournir dans l'en-tête Authorization: Bearer <token>",
  })
  accessToken!: string;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
