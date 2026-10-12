import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';

/**
 * GENERIC NESTJS SERVICE UNIT TEST TEMPLATE
 *
 * Demonstrates:
 * - Strongly-typed mock contract via ReturnType<typeof vi.fn> (No "as never")
 * - Nominal testing (Full DTO with optional fields)
 * - Boundary testing (Minimal DTO with strictly required fields)
 * - Exception testing (Ensuring downstream writes are never executed)
 */

// --- 1. Domain Types / DTOs (Replace with your actual domain classes) ---
interface CreateArticleDto {
  title: string;
  content: string;
  summary?: string; // Optional field
  tags?: string[]; // Optional field
}

interface ArticleResponseDto {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  authorId: string;
  createdAt: Date;
}

// --- 2. Generic Database / ORM Client Interface ---
interface DbClient {
  user: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string; isActive: boolean } | null>;
  };
  article: {
    create: (args: { data: any }) => Promise<ArticleResponseDto>;
  };
}

// --- 3. Example Service under Test ---
class ArticlesService {
  constructor(private readonly db: DbClient) {}

  async create(dto: CreateArticleDto, authorId: string): Promise<ArticleResponseDto> {
    const author = await this.db.user.findUnique({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException(`Author with ID "${authorId}" not found`);
    }

    if (!author.isActive) {
      throw new ConflictException('Inactive authors cannot publish articles');
    }

    return this.db.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        summary: dto.summary ?? null,
        tags: dto.tags ?? [],
        authorId,
      },
    });
  }
}

// --- 4. Unit Test Suite ---
describe('ArticlesService (Generic Service Pattern)', () => {
  let service: ArticlesService;

  // Strongly-typed mock contract: prevents "as never" and vi.mocked boilerplate
  let mockDb: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    article: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockDb = {
      user: {
        findUnique: vi.fn(),
      },
      article: {
        create: vi.fn(),
      },
    };

    service = new ArticlesService(mockDb as unknown as DbClient);
  });

  describe('create - Nominal Scenario (All optional fields populated)', () => {
    it('should create article with optional summary and tags', async () => {
      const fullDto: CreateArticleDto = {
        title: 'NestJS Architecture',
        content: 'Deep dive into clean architecture in NestJS...',
        summary: 'A short summary',
        tags: ['nestjs', 'typescript', 'testing'],
      };

      const mockCreatedArticle: ArticleResponseDto = {
        id: 'art-uuid-1',
        title: fullDto.title,
        content: fullDto.content,
        summary: fullDto.summary ?? null,
        tags: fullDto.tags ?? [],
        authorId: 'author-uuid-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      mockDb.user.findUnique.mockResolvedValueOnce({ id: 'author-uuid-1', isActive: true });
      mockDb.article.create.mockResolvedValueOnce(mockCreatedArticle);

      const result = await service.create(fullDto, 'author-uuid-1');

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { id: 'author-uuid-1' } });
      expect(mockDb.article.create).toHaveBeenCalledWith({
        data: {
          title: fullDto.title,
          content: fullDto.content,
          summary: 'A short summary',
          tags: ['nestjs', 'typescript', 'testing'],
          authorId: 'author-uuid-1',
        },
      });
      expect(result).toEqual(mockCreatedArticle);
    });
  });

  describe('create - Boundary Scenario (Minimal DTO: strictly required fields only)', () => {
    it('should create article when optional summary and tags are omitted (null/undefined safety)', async () => {
      const minimalDto: CreateArticleDto = {
        title: 'Minimal Article',
        content: 'Content with no optional attributes.',
        // summary and tags are intentionally omitted (undefined)
      };

      const mockMinimalResponse: ArticleResponseDto = {
        id: 'art-uuid-2',
        title: minimalDto.title,
        content: minimalDto.content,
        summary: null,
        tags: [],
        authorId: 'author-uuid-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      mockDb.user.findUnique.mockResolvedValueOnce({ id: 'author-uuid-1', isActive: true });
      mockDb.article.create.mockResolvedValueOnce(mockMinimalResponse);

      const result = await service.create(minimalDto, 'author-uuid-1');

      // Assert default fallback values
      expect(result.summary).toBeNull();
      expect(result.tags).toEqual([]);
      expect(mockDb.article.create).toHaveBeenCalledWith({
        data: {
          title: minimalDto.title,
          content: minimalDto.content,
          summary: null,
          tags: [],
          authorId: 'author-uuid-1',
        },
      });
    });
  });

  describe('create - Exception & Invariant Handling', () => {
    it('should throw NotFoundException when author does not exist and NEVER create an article', async () => {
      mockDb.user.findUnique.mockResolvedValueOnce(null);

      const dto: CreateArticleDto = { title: 'Test', content: 'Test Content' };

      await expect(service.create(dto, 'non-existent-author')).rejects.toThrow(
        NotFoundException,
      );

      // CRITICAL ASSERTION: Ensure write mutation is never triggered on failure
      expect(mockDb.article.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when author is inactive and NEVER create an article', async () => {
      mockDb.user.findUnique.mockResolvedValueOnce({ id: 'author-uuid-1', isActive: false });

      const dto: CreateArticleDto = { title: 'Test', content: 'Test Content' };

      await expect(service.create(dto, 'author-uuid-1')).rejects.toThrow(ConflictException);

      // CRITICAL ASSERTION: Ensure write mutation is never triggered on failure
      expect(mockDb.article.create).not.toHaveBeenCalled();
    });
  });
});
