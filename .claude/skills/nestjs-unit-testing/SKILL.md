---
name: nestjs-unit-testing
description: Universal standard and best practices for writing clean, type-safe, and robust unit tests in any NestJS application (Vitest or Jest). Covers Test.createTestingModule (zero-assertion pattern), strongly-typed mock contracts for repositories and ORMs (Prisma, TypeORM, Mongoose), boundary testing for optional vs mandatory DTO fields, and exception assertions.
user-invocable: true
---

# NestJS Unit Testing Best Practices

Comprehensive, universal, and enterprise-grade guide for writing fast, maintainable, and type-safe unit tests in **any NestJS application**, whether using **Vitest** or **Jest**.

---

## Core Philosophy

1. **Unit tests test behavior in pure isolation**: Execute in-memory in RAM (execution time < 50ms per suite). No database, no network, no HTTP server.
2. **Zero-Assertion Type Safety**: Zero tolerance for `as any`, `as unknown as`, and `as never` in test suites. Rely on NestJS Dependency Injection and TypeScript type inference.
3. **Behavior & Invariants over Mechanics**: Test input-to-output contracts, edge cases, and safety invariants, not trivial internal framework plumbing.
4. **Fast Feedback Loop**: Unit tests must run deterministically in local dev and CI in seconds.

---

## 1. Controller Unit Testing with `Test.createTestingModule` (Universal Zero-`as` Pattern)

### The Problem
Manually instantiating a controller via `new UsersController(mockService as unknown as UsersService)` forces cumbersome `as unknown as` type assertions. TypeScript's structural typing rejects plain mock objects when classes contain private/protected properties or custom methods.

### The Best Practice
Use NestJS's `@nestjs/testing` package. The `TestingModule` compiles the DI graph in memory, resolving all controller dependencies with **100% type safety and zero type casting**:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest'; // Or @jest/globals
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUserResponse: UserResponseDto = {
    id: 'user-uuid-1',
    email: 'alex@example.com',
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

    // 100% type-safe resolution through NestJS DI container — ZERO `as` assertions!
    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(usersService).toBeDefined();
  });

  it('should delegate create call to service with correct parameters and return result', async () => {
    const currentUser = { id: 'admin-uuid-1' };
    const dto: CreateUserDto = {
      email: 'alex@example.com',
      name: 'Alex Doe',
      bio: 'Software engineer',
    };

    const result = await controller.create(dto, currentUser);

    expect(result).toEqual(mockUserResponse);
    expect(usersService.create).toHaveBeenCalledWith(dto, currentUser.id);
  });
});
```

---

## 2. Service Unit Testing with Strong Mock Typing (Universal Zero-`as never` Pattern)

### The Problem
When testing a service that interacts with an ORM or Repository (Prisma, TypeORM, Mongoose, MikroORM), mocking nested methods directly inside tests often produces TypeScript typing errors. Developers frequently resort to:
```typescript
// ❌ ANTI-PATTERN: Blind type casting to silence TypeScript
mockPrisma.user.findUnique.mockResolvedValueOnce({ ... } as never);
```

### The Best Practice
Declare a **Strongly-Typed Mock Contract** using `ReturnType<typeof vi.fn>` (or `jest.Mock`). This guarantees complete IDE autocompletion, type safety on mock return values, and eliminates `as never` or `vi.mocked()`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseService } from '@/database/database.service'; // Or PrismaService / Repository

describe('UsersService', () => {
  let service: UsersService;

  // Strongly-typed mock contract — no "as never" required!
  let mockDb: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockDb = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    service = new UsersService(mockDb as unknown as DatabaseService);
  });

  it('should create user when valid data is provided', async () => {
    const mockCreatedUser = {
      id: 'user-uuid-1',
      email: 'alex@example.com',
      name: 'Alex Doe',
      createdAt: new Date(),
    };

    // Direct, strongly-typed mock resolution
    mockDb.user.create.mockResolvedValueOnce(mockCreatedUser);

    const dto = { email: 'alex@example.com', name: 'Alex Doe' };
    const result = await service.create(dto);

    expect(mockDb.user.create).toHaveBeenCalledWith({ data: dto });
    expect(result).toEqual(mockCreatedUser);
  });
});
```

---

## 3. Mandatory vs Optional Fields Strategy (Boundary Testing)

### The Anti-Pattern: Combinatorial Explosion
If a DTO has $N$ optional fields (`bio?`, `avatarUrl?`, `phoneNumber?`, `address?`), testing every permutation requires $2^N$ test cases. For 6 optional fields, that is 64 redundant unit tests!

### The Best Practice: The Two-Scenario Rule
For any operation accepting optional fields, write exactly **two targeted scenarios**:

1. **Nominal Scenario (DTO Complet)**:
   - Provide **all fields** (mandatory + all optional fields).
   - Validates that optional properties are correctly propagated, transformed, and persisted.

2. **Boundary Scenario (DTO Minimal)**:
   - Provide **strictly mandatory fields only** (all optional fields omitted).
   - Validates that the application handles `undefined` / `null` without crashing.

### Why the Minimal Scenario is Non-Negotiable:
- **Prevents Runtime `TypeError`**: Detects fatal bugs like `dto.bio.trim()` when `bio` is `undefined` (`Cannot read properties of undefined`).
- **Validates Database Nullability**: Ensures database default values (`NULL`, `DEFAULT ''`, empty array `[]`) are correctly applied when options are omitted.
- **Validates Branching Logic**: Ensures fallback default assignments (`dto.tags ?? []`, `dto.summary ?? null`) execute properly.

```typescript
it('should create entity successfully when optional fields are omitted', async () => {
  const minimalDto: CreateArticleDto = {
    title: 'Clean Architecture',
    content: 'Unit testing principles in NestJS...',
    // summary and tags are intentionally omitted (undefined)
  };

  mockDb.article.create.mockResolvedValueOnce({
    id: 'art-uuid-1',
    title: minimalDto.title,
    content: minimalDto.content,
    summary: null,
    tags: [],
    createdAt: new Date(),
  });

  const result = await service.create(minimalDto, 'author-1');

  // Verify that optional fields gracefully defaulted
  expect(result.summary).toBeNull();
  expect(result.tags).toEqual([]);
  expect(mockDb.article.create).toHaveBeenCalledWith({
    data: {
      title: minimalDto.title,
      content: minimalDto.content,
      summary: null,
      tags: [],
      authorId: 'author-1',
    },
  });
});
```

---

## 4. Testing Exceptions: Who Tests What?

| Test Layer | Focus | What to Test |
| :--- | :--- | :--- |
| **Controller (`*.controller.spec.ts`)** | Thin routing layer | Test delegation & happy path. Verify parameters match service signatures. |
| **Service (`*.service.spec.ts`)** | Business logic & domain rules | **100% of exceptions thrown in the service** (`NotFoundException`, `ConflictException`, custom domain errors). **Assert mutations are skipped!** |
| **E2E (`*.e2e-spec.ts`)** | HTTP pipeline & framework filters | Test real HTTP codes: `400 Bad Request` (ValidationPipe), `401 Unauthorized` (JwtAuthGuard), `403 Forbidden` (RolesGuard). |

### The Golden Rule of Exception Testing:
Whenever testing an exception, **always assert that subsequent database writes or downstream mutations were NEVER called**:

```typescript
it('should throw NotFoundException when target entity does not exist and NEVER trigger write mutation', async () => {
  // 1. Simulate target entity not found
  mockDb.user.findUnique.mockResolvedValueOnce(null);

  const dto = { title: 'Test Article', content: 'Sample' };

  // 2. Expect error rejection
  await expect(service.create(dto, 'unknown-author-id')).rejects.toThrow(NotFoundException);

  // 3. CRITICAL INVARIANT: Verify write was NEVER called
  expect(mockDb.article.create).not.toHaveBeenCalled();
});
```

---

## 5. Vitest & Jest Mocking Tools Decoded

Whether using Vitest or Jest, the mocking concepts map 1-to-1:

| Mocking Tool (Vitest) | Equivalent (Jest) | When to Use | Typical Example |
| :--- | :--- | :--- | :--- |
| `vi.fn()` | `jest.fn()` | Create a standalone mock function from scratch | `const mock = vi.fn().mockResolvedValue(data);` |
| `vi.spyOn(obj, 'method')` | `jest.spyOn(obj, 'method')` | Intercept or inspect an existing object's method | `vi.spyOn(service, 'create').mockRejectedValueOnce(err);` |
| `vi.mock('module')` | `jest.mock('module')` | Intercept and mock an entire external package / ES module | `vi.mock('bcrypt', () => ({ hash: vi.fn() }));` |
| `vi.mocked(fn)` | `jest.mocked(fn)` | Inform TypeScript that an imported function is a mock | `vi.mocked(bcrypt.hash).mockResolvedValue('hash');` |

---

## 6. Universal 7-Point Quality Checklist Before Approving Tests

- [ ] **Zero `as` in Controllers**: Controller test initializes with `Test.createTestingModule` and retrieves instances via `module.get()`.
- [ ] **Zero `as never` in Services**: Mocks are typed via `ReturnType<typeof vi.fn>` (or `jest.Mock`).
- [ ] **Two-Scenario Rule for DTOs**: Service tests cover both Full DTO (nominal) and Minimal DTO (strictly required fields).
- [ ] **100% Exception Coverage**: Every `throw new HttpException` or domain exception in the service has a corresponding unit test.
- [ ] **Mutation Safety Assertion**: Exception tests explicitly verify that mutations (`create`, `update`, `delete`, `$transaction`) were `not.toHaveBeenCalled()`.
- [ ] **BDD Naming Convention**: Tests follow `it('should [expected behavior] when/if [condition]')`.
- [ ] **Pure In-Memory Execution**: The entire unit test suite runs in RAM in < 100ms without connecting to live databases or ports.

---

## 7. Bundled Reference Templates

For fast scaffolding in any NestJS project, refer to the portable template files bundled in this skill's `references/` directory:

- [Controller Spec Template](references/controller-spec-template.ts) - Generic zero-`as` `Test.createTestingModule` pattern.
- [Service Spec Template](references/service-spec-template.ts) - Generic strongly typed mocks, boundary testing (minimal vs full DTO), and mutation skipping verification.
