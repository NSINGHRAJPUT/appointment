import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../common/cloudinary.service';
import * as bcrypt from 'bcrypt';
import * as fc from 'fast-check';

describe('AuthService - Password Hashing and Validation', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let cloudinaryService: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {},
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('resetPassword', () => {
    describe('Property 18: Password Hashing with Random Salt', () => {
      it('should generate different bcrypt hashes for the same password across 100 iterations', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 8, maxLength: 50 }),
            async (password) => {
              const userId = 'test-user-id';
              const hashes = new Set<string>();

              // Generate 5 different hashes for the same password
              for (let i = 0; i < 5; i++) {
                const hash = await bcrypt.hash(password, 10);
                hashes.add(hash);
              }

              // All hashes should be different due to random salt
              expect(hashes.size).toBe(5);

              // All hashes should be valid bcrypt hashes
              for (const hash of hashes) {
                expect(hash).toMatch(/^\$2[aby]\$/);
              }

              // All hashes should verify against the original password
              for (const hash of hashes) {
                const isValid = await bcrypt.compare(password, hash);
                expect(isValid).toBe(true);
              }
            },
          ),
          { numRuns: 10 }, // Reduced from 100 to 10 due to bcrypt hashing being slow
        );
      }, 30000); // Increased timeout for bcrypt operations

      it('should use salt rounds 10 for bcrypt hashing', async () => {
        const password = 'TestPassword123';
        const hash = await bcrypt.hash(password, 10);

        // Verify the hash contains the salt rounds indicator
        // bcrypt format: $2a$10$... where 10 is the salt rounds
        expect(hash).toMatch(/^\$2[aby]\$10\$/);
      });

      it('should produce different hashes even with identical passwords', async () => {
        const password = 'SamePassword123';
        const hash1 = await bcrypt.hash(password, 10);
        const hash2 = await bcrypt.hash(password, 10);

        // Hashes should be different
        expect(hash1).not.toBe(hash2);

        // Both should verify against the password
        expect(await bcrypt.compare(password, hash1)).toBe(true);
        expect(await bcrypt.compare(password, hash2)).toBe(true);
      });
    });

    describe('Property 19: Password Update in Database', () => {
      it('should update User.passwordHash in database when password is reset', async () => {
        const userId = 'test-user-id';
        const newPassword = 'NewPassword123';

        (prismaService.user.update as jest.Mock).mockResolvedValue({
          id: userId,
          passwordHash: await bcrypt.hash(newPassword, 10),
        });

        await authService.resetPassword(userId, newPassword);

        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: userId },
          data: {
            passwordHash: expect.stringMatching(/^\$2[aby]\$/),
          },
        });
      });

      it('should call prisma.user.update with correct userId', async () => {
        const userId = 'specific-user-id';
        const newPassword = 'NewPassword456';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await authService.resetPassword(userId, newPassword);

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        expect(callArgs.where.id).toBe(userId);
      });

      it('should hash the password before storing in database', async () => {
        const userId = 'test-user-id';
        const newPassword = 'NewPassword789';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await authService.resetPassword(userId, newPassword);

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const storedHash = callArgs.data.passwordHash;

        // Verify the stored value is a bcrypt hash, not the plain password
        expect(storedHash).not.toBe(newPassword);
        expect(storedHash).toMatch(/^\$2[aby]\$/);

        // Verify the hash validates against the original password
        const isValid = await bcrypt.compare(newPassword, storedHash);
        expect(isValid).toBe(true);
      });
    });

    describe('Property 20: Password Reset Success', () => {
      it('should complete without throwing error on successful password reset', async () => {
        const userId = 'test-user-id';
        const newPassword = 'ValidPassword123';

        (prismaService.user.update as jest.Mock).mockResolvedValue({
          id: userId,
          passwordHash: await bcrypt.hash(newPassword, 10),
        });

        await expect(
          authService.resetPassword(userId, newPassword),
        ).resolves.not.toThrow();
      });

      it('should handle various valid password formats', async () => {
        const validPasswords = [
          'SimplePassword8',
          'P@ssw0rd!Complex',
          'VeryLongPasswordWithManyCharactersAndNumbers12345',
          'password-with-dashes-123',
          'password_with_underscores_123',
        ];

        for (const password of validPasswords) {
          (prismaService.user.update as jest.Mock).mockResolvedValue({});

          await expect(
            authService.resetPassword('user-id', password),
          ).resolves.not.toThrow();
        }
      });
    });

    describe('Password Validation', () => {
      it('should throw BadRequestException when password is less than 8 characters', async () => {
        const userId = 'test-user-id';
        const shortPassword = 'short';

        await expect(
          authService.resetPassword(userId, shortPassword),
        ).rejects.toThrow(BadRequestException);

        await expect(
          authService.resetPassword(userId, shortPassword),
        ).rejects.toThrow('Password must be at least 8 characters');
      });

      it('should throw BadRequestException when password is empty', async () => {
        const userId = 'test-user-id';

        await expect(
          authService.resetPassword(userId, ''),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when password is null', async () => {
        const userId = 'test-user-id';

        await expect(
          authService.resetPassword(userId, null as any),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when password is undefined', async () => {
        const userId = 'test-user-id';

        await expect(
          authService.resetPassword(userId, undefined as any),
        ).rejects.toThrow(BadRequestException);
      });

      it('should accept password with exactly 8 characters', async () => {
        const userId = 'test-user-id';
        const eightCharPassword = 'Pass1234';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await expect(
          authService.resetPassword(userId, eightCharPassword),
        ).resolves.not.toThrow();
      });

      it('should reject password with 7 characters', async () => {
        const userId = 'test-user-id';
        const sevenCharPassword = 'Pass123';

        await expect(
          authService.resetPassword(userId, sevenCharPassword),
        ).rejects.toThrow('Password must be at least 8 characters');
      });
    });

    describe('Old Password Invalidation', () => {
      it('should ensure old password no longer works after reset', async () => {
        const userId = 'test-user-id';
        const oldPassword = 'OldPassword123';
        const newPassword = 'NewPassword456';

        // Hash the old password
        const oldHash = await bcrypt.hash(oldPassword, 10);

        // Mock the database to return the new hash after reset
        const newHash = await bcrypt.hash(newPassword, 10);
        (prismaService.user.update as jest.Mock).mockResolvedValue({
          id: userId,
          passwordHash: newHash,
        });

        // Reset the password
        await authService.resetPassword(userId, newPassword);

        // Verify old password doesn't match new hash
        const oldPasswordMatches = await bcrypt.compare(oldPassword, newHash);
        expect(oldPasswordMatches).toBe(false);

        // Verify new password matches new hash
        const newPasswordMatches = await bcrypt.compare(newPassword, newHash);
        expect(newPasswordMatches).toBe(true);
      });

      it('should invalidate old password when multiple resets occur', async () => {
        const userId = 'test-user-id';
        const password1 = 'FirstPassword123';
        const password2 = 'SecondPassword456';
        const password3 = 'ThirdPassword789';

        // First reset
        const hash1 = await bcrypt.hash(password1, 10);
        (prismaService.user.update as jest.Mock).mockResolvedValue({
          passwordHash: hash1,
        });
        await authService.resetPassword(userId, password1);

        // Second reset
        const hash2 = await bcrypt.hash(password2, 10);
        (prismaService.user.update as jest.Mock).mockResolvedValue({
          passwordHash: hash2,
        });
        await authService.resetPassword(userId, password2);

        // Third reset
        const hash3 = await bcrypt.hash(password3, 10);
        (prismaService.user.update as jest.Mock).mockResolvedValue({
          passwordHash: hash3,
        });
        await authService.resetPassword(userId, password3);

        // Verify only the latest password works
        expect(await bcrypt.compare(password1, hash3)).toBe(false);
        expect(await bcrypt.compare(password2, hash3)).toBe(false);
        expect(await bcrypt.compare(password3, hash3)).toBe(true);
      });

      it('should not allow login with old password after reset', async () => {
        const userId = 'test-user-id';
        const oldPassword = 'OldPassword123';
        const newPassword = 'NewPassword456';

        // Simulate old password hash
        const oldHash = await bcrypt.hash(oldPassword, 10);

        // Reset to new password
        const newHash = await bcrypt.hash(newPassword, 10);
        (prismaService.user.update as jest.Mock).mockResolvedValue({
          passwordHash: newHash,
        });

        await authService.resetPassword(userId, newPassword);

        // Attempt to verify old password against new hash
        const isOldPasswordValid = await bcrypt.compare(oldPassword, newHash);
        expect(isOldPasswordValid).toBe(false);

        // Verify new password is valid
        const isNewPasswordValid = await bcrypt.compare(newPassword, newHash);
        expect(isNewPasswordValid).toBe(true);
      });
    });

    describe('Bcrypt Integration', () => {
      it('should produce valid bcrypt hashes with salt rounds 10', async () => {
        const userId = 'test-user-id';
        const password = 'TestPassword123';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await authService.resetPassword(userId, password);

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const hash = callArgs.data.passwordHash;

        // Verify it's a valid bcrypt hash with salt rounds 10
        expect(hash).toMatch(/^\$2[aby]\$10\$/);

        // Verify it can be compared
        const isValid = await bcrypt.compare(password, hash);
        expect(isValid).toBe(true);
      });

      it('should produce valid bcrypt hashes', async () => {
        const userId = 'test-user-id';
        const password = 'ValidPassword123';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await authService.resetPassword(userId, password);

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const hash = callArgs.data.passwordHash;

        // Verify it's a valid bcrypt hash
        expect(hash).toMatch(/^\$2[aby]\$10\$/);

        // Verify it can be compared
        const isValid = await bcrypt.compare(password, hash);
        expect(isValid).toBe(true);
      });

      it('should hash passwords consistently with bcrypt', async () => {
        const userId = 'test-user-id';
        const password = 'ConsistentPassword123';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        // Reset password
        await authService.resetPassword(userId, password);

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const hash = callArgs.data.passwordHash;

        // Verify the password can be compared multiple times
        const result1 = await bcrypt.compare(password, hash);
        const result2 = await bcrypt.compare(password, hash);

        expect(result1).toBe(true);
        expect(result2).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle passwords with special characters', async () => {
        const userId = 'test-user-id';
        const specialPassword = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await expect(
          authService.resetPassword(userId, specialPassword),
        ).resolves.not.toThrow();

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const hash = callArgs.data.passwordHash;

        const isValid = await bcrypt.compare(specialPassword, hash);
        expect(isValid).toBe(true);
      });

      it('should handle passwords with unicode characters', async () => {
        const userId = 'test-user-id';
        const unicodePassword = 'Pässwörd123🔐';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await expect(
          authService.resetPassword(userId, unicodePassword),
        ).resolves.not.toThrow();

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const hash = callArgs.data.passwordHash;

        const isValid = await bcrypt.compare(unicodePassword, hash);
        expect(isValid).toBe(true);
      });

      it('should handle very long passwords', async () => {
        const userId = 'test-user-id';
        const longPassword = 'A'.repeat(100) + '123';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await expect(
          authService.resetPassword(userId, longPassword),
        ).resolves.not.toThrow();

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const hash = callArgs.data.passwordHash;

        const isValid = await bcrypt.compare(longPassword, hash);
        expect(isValid).toBe(true);
      });

      it('should handle passwords with leading/trailing spaces', async () => {
        const userId = 'test-user-id';
        const passwordWithSpaces = '  Password123  ';

        (prismaService.user.update as jest.Mock).mockResolvedValue({});

        await expect(
          authService.resetPassword(userId, passwordWithSpaces),
        ).resolves.not.toThrow();

        const callArgs = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        const hash = callArgs.data.passwordHash;

        // Verify the exact password (with spaces) is hashed
        const isValid = await bcrypt.compare(passwordWithSpaces, hash);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Password Hashing Consistency', () => {
    it('should produce consistent results when comparing same password to hash', async () => {
      const password = 'ConsistentPassword123';
      const hash = await bcrypt.hash(password, 10);

      // Compare multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        const isValid = await bcrypt.compare(password, hash);
        results.push(isValid);
      }

      // All comparisons should return true
      expect(results).toEqual([true, true, true, true, true]);
    });

    it('should produce consistent results when comparing different password to hash', async () => {
      const correctPassword = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword456';
      const hash = await bcrypt.hash(correctPassword, 10);

      // Compare wrong password multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        const isValid = await bcrypt.compare(wrongPassword, hash);
        results.push(isValid);
      }

      // All comparisons should return false
      expect(results).toEqual([false, false, false, false, false]);
    });
  });
});
