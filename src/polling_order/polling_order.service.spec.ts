import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PollingOrderService } from './polling_order.service';
import { PollingOrder } from './polling_order.entity';
import { AuthService } from '../auth/auth.service';

const mockRepository = {
  find: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockPollingOrder: Partial<PollingOrder> = {
  polling_order_id: 1,
  polling_order_name: 'Test Order',
  polling_order_admin: 42,
  polling_order_admin_assistant: 100
};

describe('PollingOrderService', () => {
  let service: PollingOrderService;
  let authService: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollingOrderService,
        {
          provide: getRepositoryToken(PollingOrder),
          useValue: mockRepository
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), decode: jest.fn() }
        },
        {
          provide: AuthService,
          useValue: {
            isOrderAdmin: jest.fn().mockReturnValue(true)
          }
        }
      ]
    }).compile();

    service = module.get<PollingOrderService>(PollingOrderService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPollingOrders', () => {
    it('should return all polling orders', async () => {
      const orders = [mockPollingOrder];
      mockRepository.find.mockResolvedValue(orders);

      const result = await service.getPollingOrders();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(orders);
    });

    it('should return empty array when no orders exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getPollingOrders();

      expect(result).toEqual([]);
    });
  });

  describe('getPollingOrderById', () => {
    it('should return a polling order by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockPollingOrder);

      const result = await service.getPollingOrderById(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ polling_order_id: 1 });
      expect(result).toEqual(mockPollingOrder);
    });

    it('should return null when order not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getPollingOrderById(999);

      expect(result).toBeNull();
    });
  });

  describe('createPollingOrder', () => {
    const createBody: any = {
      polling_order_name: 'New Order',
      polling_order_admin: 42,
      polling_order_admin_assistant: 100,
      authToken: 'admin-token'
    };

    it('should create and return a polling order when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.save.mockResolvedValue({ ...createBody, polling_order_id: 2 });

      const result = await service.createPollingOrder(createBody);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should set correct fields on the new polling order', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.save.mockImplementation(order => Promise.resolve({ ...order, polling_order_id: 2 }));

      const result = await service.createPollingOrder(createBody);

      expect(result.polling_order_name).toBe('New Order');
      expect(result.polling_order_admin).toBe(42);
      expect(result.polling_order_admin_assistant).toBe(100);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.createPollingOrder(createBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('editPollingOrder', () => {
    const editBody: any = {
      polling_order_id: 1,
      polling_order_name: 'Updated Order',
      polling_order_admin: 42,
      polling_order_admin_assistant: 100,
      authToken: 'admin-token'
    };

    it('should update polling order and return true when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.editPollingOrder(editBody);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        polling_order_name: 'Updated Order',
        polling_order_admin: 42,
        polling_order_admin_assistant: 100
      });
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.editPollingOrder(editBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deletePollingOrder', () => {
    const deleteBody: any = {
      polling_order_id: 1,
      authToken: 'admin-token'
    };

    it('should delete polling order and return true when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deletePollingOrder(deleteBody);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.deletePollingOrder(deleteBody)).rejects.toThrow(UnauthorizedException);
    });
  });
});
