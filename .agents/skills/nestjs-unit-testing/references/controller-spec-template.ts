import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * GENERIC NESTJS CONTROLLER UNIT TEST TEMPLATE
 *
 * Demonstrates:
 * - 100% type-safe dependency injection via Test.createTestingModule
 * - ZERO "as any", "as unknown as", or type assertions
 * - Testing delegation to service layer with exact arguments
 */

// --- 1. Domain Types / DTOs (Replace with your actual domain classes) ---
interface CreateUserDto {
  email: string;
  name: string;
  bio?: string;
}

interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  createdAt: Date;
}

interface AuthenticatedUser {
  id: string;
  role: string;
}

// --- 2. Minimal Mockable Service & Controller Classes ---
class UsersService {
  async create(_dto: CreateUserDto, _creatorId: string): Promise<UserResponseDto> {
    throw new Error('Real implementation - must be mocked in unit tests');
  }

  async findById(_id: string): Promise<UserResponseDto> {
    throw new Error('Real implementation - must be mocked in unit tests');
  }
}

class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async create(dto: CreateUserDto, currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.create(dto, currentUser.id);
  }

  async findById(id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
}

// --- 3. Unit Test Suite ---
describe('UsersController (Generic Controller Pattern)', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUserResponse: UserResponseDto = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    name: 'Alex Doe',
    bio: 'Software engineer',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: vi.fn().mockResolvedValue(mockUserResponse),
            findById: vi.fn().mockResolvedValue(mockUserResponse),
          },
        },
      ],
    }).compile();

    // Zero-assertion DI resolution - 100% type-safe
    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(usersService).toBeDefined();
  });

  it('should delegate create call to service with correct parameters and return result', async () => {
    const currentUser: AuthenticatedUser = { id: 'admin-uuid-1', role: 'ADMIN' };
    const dto: CreateUserDto = {
      email: 'user@example.com',
      name: 'Alex Doe',
      bio: 'Software engineer',
    };

    const result = await controller.create(dto, currentUser);

    expect(result).toEqual(mockUserResponse);
    expect(usersService.create).toHaveBeenCalledWith(dto, currentUser.id);
  });

  it('should delegate findById call to service and return result', async () => {
    const result = await controller.findById('user-uuid-1');

    expect(result).toEqual(mockUserResponse);
    expect(usersService.findById).toHaveBeenCalledWith('user-uuid-1');
  });
});
