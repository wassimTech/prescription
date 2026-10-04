import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscrire un nouvel utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès et token JWT émis',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Un utilisateur avec cet email existe déjà',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authentifier un utilisateur avec email et mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Identifiants valides, session ouverte et token JWT émis',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Email ou mot de passe invalide',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur actuellement authentifié" })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur courant',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié ou token invalide',
  })
  async getProfile(@CurrentUser() user: UserProfileDto): Promise<UserProfileDto> {
    return user;
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Endpoint réservé aux administrateurs (contrôle RBAC)' })
  @ApiResponse({
    status: 200,
    description: 'Accès autorisé aux administrateurs',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé pour les autres rôles',
  })
  async getAdminResource(): Promise<{ message: string }> {
    return { message: 'Administration console accessed successfully' };
  }
}
