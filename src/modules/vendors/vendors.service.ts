import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Vendor } from '../../entities/vendor.entity.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';

@Injectable()
export class VendorsService {
  constructor(@InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>) {}

  async findAll(pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await this.vendorRepo.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  create(dto: CreateVendorDto) {
    return this.vendorRepo.save(this.vendorRepo.create(dto));
  }

  async update(id: string, dto: CreateVendorDto) {
    const vendor = await this.vendorRepo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    Object.assign(vendor, dto);
    return this.vendorRepo.save(vendor);
  }

  async softDelete(id: string) {
    await this.vendorRepo.softDelete(id);
    return { id, deleted: true };
  }
}
