import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorsQueryDto } from './dto/vendors-query.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { PaginatedResult } from '../common/pagination.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: VendorsQueryDto): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }

    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }

    const [total, data] = await Promise.all([
      this.prisma.vendor.count({ where }),
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            cars: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async findByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            bookings: true,
            cars: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor account not found for this user');
    }

    return vendor;
  }

  async findCars(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.car.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReviews(vendorId: string, query: any): Promise<PaginatedResult<any>> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.review.count({
        where: { vendorId },
      }),
      this.prisma.review.findMany({
        where: { vendorId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              customer: {
                select: {
                  name: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  async updateMe(userId: string, dto: UpdateVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.vendor.update({
      where: { userId },
      data: {
        businessName: dto.businessName ?? undefined,
        ownerName: dto.ownerName ?? undefined,
        city: dto.city ?? undefined,
        gstNumber: dto.gstNumber ?? undefined,
        panNumber: dto.panNumber ?? undefined,
        bankDetails: dto.bankDetails ?? undefined,
        businessType: dto.businessType ?? undefined,
        yearsInOperation: dto.yearsInOperation ?? undefined,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateVendorStatusDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.vendor.update({
      where: { id },
      data: { verificationStatus: dto.status },
    });
  }
}
