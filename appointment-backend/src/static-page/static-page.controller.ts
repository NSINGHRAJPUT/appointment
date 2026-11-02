import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { StaticPageService } from './static-page.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsString } from 'class-validator';

class UpsertPageDto {
  @IsString() title: string;
  @IsString() content: string;
}

@Controller('static-pages')
export class StaticPageController {
  constructor(private readonly staticPageService: StaticPageService) {}

  // Public
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.staticPageService.getBySlug(slug);
  }

  // Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  getAll() {
    return this.staticPageService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':slug')
  upsert(@Param('slug') slug: string, @Body() body: UpsertPageDto) {
    return this.staticPageService.upsert(slug, body);
  }
}
