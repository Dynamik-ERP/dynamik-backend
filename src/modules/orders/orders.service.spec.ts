import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';
import { OrdersService } from './orders.service.js';
import { Order } from '../../entities/order.entity.js';
import { OrderItem } from '../../entities/order-item.entity.js';
import { ClientDesignerAssignment } from '../../entities/client-designer-assignment.entity.js';
import { User } from '../../entities/user.entity.js';
import { OrderStatus } from '../../entities/enums.js';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: Repository<Order>;

  const mockOrderRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOrderItemRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAssignmentRepo = {
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepo },
        { provide: getRepositoryToken(ClientDesignerAssignment), useValue: mockAssignmentRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = module.get<Repository<Order>>(getRepositoryToken(Order));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndTransitionToReady', () => {
    it('should transition status to READY_FOR_PRODUCTION if both price and design are approved', async () => {
      const order = {
        id: 'order-uuid',
        status: OrderStatus.IN_PROGRESS,
        priceOffers: [{ status: 'approved' }],
        designs: [{ status: 'approved' }],
      } as any;

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.save.mockResolvedValue(order);

      await service.checkAndTransitionToReady('order-uuid');

      expect(order.status).toBe(OrderStatus.READY_FOR_PRODUCTION);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.ready_for_production', { orderId: 'order-uuid' });
    });

    it('should NOT transition status if only design is approved', async () => {
      const order = {
        id: 'order-uuid',
        status: OrderStatus.IN_PROGRESS,
        priceOffers: [{ status: 'pending' }],
        designs: [{ status: 'approved' }],
      } as any;

      mockOrderRepo.findOne.mockResolvedValue(order);

      await service.checkAndTransitionToReady('order-uuid');

      expect(order.status).toBe(OrderStatus.IN_PROGRESS);
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
