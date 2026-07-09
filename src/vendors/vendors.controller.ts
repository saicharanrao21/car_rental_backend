import { Controller, Get, Patch, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { VendorsQueryDto } from './dto/vendors-query.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { PaginationDto } from '../common/pagination.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async findAll(@Req() req: any, @Query() query: VendorsQueryDto) {
    const isAdmin = this.getIsAdmin(req);
    const result = await this.vendorsService.findAll(query);
    result.data = result.data.map(vendor => this.redactVendor(vendor, isAdmin));
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Get('me')
  async findMe(@Req() req: any) {
    return this.vendorsService.findByUserId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch('me')
  async updateMe(@Req() req: any, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.updateMe(req.user.userId, dto);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const isAdmin = this.getIsAdmin(req);
    const vendor = await this.vendorsService.findOne(id);
    return this.redactVendor(vendor, isAdmin);
  }

  @Get(':id/cars')
  async findCars(@Param('id') id: string) {
    return this.vendorsService.findCars(id);
  }

  @Get(':id/reviews')
  async findReviews(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.vendorsService.findReviews(id, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateVendorStatusDto) {
    return this.vendorsService.updateStatus(id, dto);
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

  private redactVendor(vendor: any, isAdmin: boolean) {
    if (!vendor) return vendor;
    if (isAdmin) return vendor;
    
    const copy = { ...vendor };
    delete copy.gstNumber;
    delete copy.panNumber;
    delete copy.bankDetails;
    return copy;
  }
}
