import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryItem } from '../../entities/inventory-item.entity.js';
import { MaterialTransaction } from '../../entities/material-transaction.entity.js';
import { ProcurementRequest } from '../../entities/procurement-request.entity.js';
import { ProcurementRequestItem } from '../../entities/procurement-request-item.entity.js';
import { TransactionType, ApprovalStatus } from '../../entities/enums.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { CreateMaterialTransactionDto } from './dto/create-material-transaction.dto.js';
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(MaterialTransaction)
    private readonly transactionRepo: Repository<MaterialTransaction>,
    @InjectRepository(ProcurementRequest)
    private readonly procReqRepo: Repository<ProcurementRequest>,
    @InjectRepository(ProcurementRequestItem)
    private readonly procItemRepo: Repository<ProcurementRequestItem>,
    private readonly dataSource: DataSource,
  ) {}

  async listInventory(pagination: PaginationDto = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const [data, total] = await this.inventoryRepo.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async createInventoryItem(dto: CreateInventoryItemDto) {
    const item = this.inventoryRepo.create({
      name: dto.name,
      category: dto.category,
      quantity: (dto.quantity || 0).toString(),
    });
    return this.inventoryRepo.save(item);
  }

  async adjustInventory(itemId: string, dto: AdjustInventoryDto) {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(InventoryItem, {
        where: { id: itemId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Inventory item not found');

      const nextQuantity = Number(item.quantity) + dto.quantity;
      if (nextQuantity < 0) {
        throw new BadRequestException('Inventory quantity cannot be negative');
      }

      item.quantity = nextQuantity.toFixed(2);
      return manager.save(item);
    });
  }

  async createTransaction(dto: CreateMaterialTransactionDto, actorId: string) {
    if (dto.type === TransactionType.WITHDRAWAL && !dto.design_id) {
      throw new BadRequestException('Withdrawals require a design_id');
    }

    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(InventoryItem, {
        where: { id: dto.item_id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('Inventory item not found');

      const adjustment = dto.type === TransactionType.WITHDRAWAL ? -dto.quantity : dto.quantity;
      const nextQuantity = Number(item.quantity) + adjustment;
      if (nextQuantity < 0) {
        throw new BadRequestException('Insufficient inventory quantity');
      }

      const transaction = manager.create(MaterialTransaction, {
        item_id: dto.item_id,
        type: dto.type,
        quantity: dto.quantity.toFixed(2),
        design_id: dto.design_id || null,
        actor_id: actorId,
        occurred_at: new Date(),
      });

      const saved = await manager.save(transaction);

      item.quantity = nextQuantity.toFixed(2);
      await manager.save(item);

      return saved;
    });
  }

  async createProcurementRequest(dto: CreateProcurementRequestDto, requestedById: string) {
    return this.dataSource.transaction(async (manager) => {
      const request = manager.create(ProcurementRequest, {
        requested_by: requestedById,
        status: ApprovalStatus.PENDING,
      });
      const savedReq = await manager.save(request);

      const items = dto.items.map((item) =>
        manager.create(ProcurementRequestItem, {
          procurement_request_id: savedReq.id,
          item_id: item.item_id,
          quantity: item.quantity.toString(),
        }),
      );
      await manager.save(items);

      return manager.findOne(ProcurementRequest, {
        where: { id: savedReq.id },
        relations: { items: true },
      });
    });
  }

  async approveProcurementRequest(id: string) {
    const request = await this.procReqRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Procurement request not found');
    request.status = ApprovalStatus.APPROVED;
    return this.procReqRepo.save(request);
  }

  async listProcurementRequests() {
    return this.procReqRepo.find({
      relations: {
        requestedByUser: true,
        items: { item: true },
      },
      order: { created_at: 'DESC' },
    });
  }
}
