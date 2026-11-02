import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BlogStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CloudinaryService } from '../common/cloudinary.service';

class BlogQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 9;
  @IsOptional() @IsString() category?: string;
}

class CreateBlogDto {
  @IsString() title: string;
  @IsString() slug: string;
  @IsString() excerpt: string;
  @IsString() content: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsString() category: string;
  @IsString() author: string;
  @IsOptional() @Type(() => Number) @IsInt() readMins?: number;
  @IsOptional() @IsEnum(BlogStatus) status?: BlogStatus;
}

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── Admin routes (must be declared before :slug wildcard) ────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
          ? cb(null, true)
          : cb(new BadRequestException('Only JPG, PNG, and WebP images are allowed'), false);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.cloudinaryService.uploadFile(file, 'blog-covers');
    return { url: result.url };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/all')
  listAll(@Query() query: BlogQueryDto) {
    return this.blogService.listAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin')
  create(@Body() body: CreateBlogDto) {
    return this.blogService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() body: Partial<CreateBlogDto>) {
    return this.blogService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }

  // ── Public routes ────────────────────────────────────────────────────────

  @Get()
  list(@Query() query: BlogQueryDto) {
    return this.blogService.listPublished(query);
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.blogService.getBySlug(slug);
  }
}
