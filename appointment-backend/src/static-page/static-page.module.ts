import { Module } from '@nestjs/common';
import { StaticPageController } from './static-page.controller';
import { StaticPageService } from './static-page.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaticPageController],
  providers: [StaticPageService],
})
export class StaticPageModule {}
