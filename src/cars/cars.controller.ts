import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CarsService } from './cars.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CarsQueryDto } from './dto/cars-query.dto';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateBlockedDatesDto } from './dto/update-blocked-dates.dto';
import { AdminCarsQueryDto } from './dto/admin-cars-query.dto';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('cars')
  async searchCars(@Req() req: any, @Query() query: CarsQueryDto) {
    const isAdmin = this.getIsAdmin(req);
    return this.carsService.searchCars(query, isAdmin);
  }

  @Get('cars/:id')
  async findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Get('vendors/me/cars')
  async findVendorCars(@Req() req: any) {
    return this.carsService.findVendorCars(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post('vendors/me/cars')
  @HttpCode(HttpStatus.CREATED)
  async createCar(@Req() req: any, @Body() dto: CreateCarDto) {
    return this.carsService.createCar(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch('vendors/me/cars/:id')
  async updateCar(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateCarDto,
  ) {
    return this.carsService.updateCar(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch('vendors/me/cars/:id/availability')
  async updateAvailability(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.carsService.updateAvailability(id, req.user.userId, dto.isAvailable);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch('vendors/me/cars/:id/blocked-dates')
  async updateBlockedDates(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateBlockedDatesDto,
  ) {
    return this.carsService.updateBlockedDates(id, req.user.userId, dto.blockedDates);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/cars')
  async adminFindAll(@Query() query: AdminCarsQueryDto) {
    return this.carsService.adminFindAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/cars/:id/deactivate')
  async adminDeactivate(@Param('id') id: string) {
    return this.carsService.adminDeactivate(id);
  }

  // --- Helper Methods ---

  private getIsAdmin(req: any): boolean {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = this.jwtService.decode(token);
      return decoded && decoded.role === Role.ADMIN;
    } catch {
      return false;
    }
  }
}
