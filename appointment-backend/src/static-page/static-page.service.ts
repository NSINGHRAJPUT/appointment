import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaticPageService {
  constructor(private readonly prisma: PrismaService) {}

  getAll() {
    return this.prisma.staticPage.findMany({ orderBy: { slug: 'asc' } });
  }

  getBySlug(slug: string) {
    return this.prisma.staticPage.findUnique({ where: { slug } });
  }

  upsert(slug: string, data: { title: string; content: string }) {
    return this.prisma.staticPage.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });
  }
}
