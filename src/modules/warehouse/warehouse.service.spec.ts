import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryItem } from '../../entities/inventory-item.entity.js';
import { MaterialTransaction } from '../../entities/material-transaction.entity.js';
import { ProcurementRequest } from '../../entities/procurement-request.entity.js';
import { ProcurementRequestItem } from '../../entities/procurement-request-item.entity.js';
import { TransactionType } from '../../entities/enums.js';
import { WarehouseService } from './warehouse.service.js';

describe('WarehouseService', () => {
  let service: WarehouseService;
  const manager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        { provide: getRepositoryToken(InventoryItem), useValue: {} },
        { provide: getRepositoryToken(MaterialTransaction), useValue: {} },
        { provide: getRepositoryToken(ProcurementRequest), useValue: {} },
        { provide: getRepositoryToken(ProcurementRequestItem), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(WarehouseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects manual adjustments that would make inventory negative', async () => {
    manager.findOne.mockResolvedValue({ id: 'item-id', quantity: '5.00' });

    await expect(service.adjustInventory('item-id', { quantity: -6 })).rejects.toThrow(
      BadRequestException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejects withdrawals that exceed available inventory inside the transaction', async () => {
    manager.findOne.mockResolvedValue({ id: 'item-id', quantity: '2.00' });

    await expect(
      service.createTransaction(
        {
          item_id: 'item-id',
          type: TransactionType.WITHDRAWAL,
          quantity: 3,
          design_id: 'design-id',
        },
        'actor-id',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(manager.create).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });
});
