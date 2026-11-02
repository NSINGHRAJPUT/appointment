import { BadRequestException, Injectable } from '@nestjs/common';
import { BlogStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  listPublished(query: { page: number; pageSize: number; category?: string }) {
    const skip = (query.page - 1) * query.pageSize;
    const where: any = { status: BlogStatus.PUBLISHED };
    if (query.category) where.category = query.category;

    return this.prisma.$transaction(async (tx) => {
      const [total, items] = await Promise.all([
        tx.blog.count({ where }),
        tx.blog.findMany({
          where,
          skip,
          take: query.pageSize,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true, title: true, slug: true, excerpt: true,
            coverImage: true, category: true, author: true,
            readMins: true, publishedAt: true,
          },
        }),
      ]);
      return { items, total, page: query.page, pageSize: query.pageSize };
    });
  }

  async getBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({ where: { slug } });
    if (!blog || blog.status !== BlogStatus.PUBLISHED)
      throw new BadRequestException('Blog not found');
    return blog;
  }

  listAll(query: { page: number; pageSize: number }) {
    const skip = (query.page - 1) * query.pageSize;
    return this.prisma.$transaction(async (tx) => {
      const [total, items] = await Promise.all([
        tx.blog.count(),
        tx.blog.findMany({ skip, take: query.pageSize, orderBy: { createdAt: 'desc' } }),
      ]);
      return { items, total, page: query.page, pageSize: query.pageSize };
    });
  }

  create(data: {
    title: string; slug: string; excerpt: string; content: string;
    coverImage?: string; category: string; author: string;
    readMins?: number; status?: BlogStatus;
  }) {
    return this.prisma.blog.create({
      data: {
        ...data,
        publishedAt: data.status === BlogStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  async update(id: string, data: Partial<{
    title: string; slug: string; excerpt: string; content: string;
    coverImage: string; category: string; author: string;
    readMins: number; status: BlogStatus;
  }>) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new BadRequestException('Blog not found');

    const updateData: any = { ...data };
    if (data.status === BlogStatus.PUBLISHED && blog.status !== BlogStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }
    return this.prisma.blog.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new BadRequestException('Blog not found');
    return this.prisma.blog.delete({ where: { id } });
  }
}
