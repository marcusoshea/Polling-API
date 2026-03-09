import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockPayload = {
    polling_order_member_id: 42,
    polling_order_id: 5,
    pollingOrderInfo: {
      polling_order_id: 5,
      polling_order_admin: 42,
      polling_order_admin_assistant: 100
    }
  };

  const mockToken = 'mock.jwt.token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            decode: jest.fn().mockReturnValue(mockPayload)
          }
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should decode and return the JWT payload', () => {
      const result = service.validate(mockToken);
      expect(jwtService.decode).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockPayload);
    });
  });

  describe('isOrderAdmin', () => {
    it('should return true when member is the order admin', () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue({ ...mockPayload, polling_order_member_id: 42 });
      expect(service.isOrderAdmin(mockToken)).toBe(true);
    });

    it('should return true when member is the admin assistant', () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue({ ...mockPayload, polling_order_member_id: 100 });
      expect(service.isOrderAdmin(mockToken)).toBe(true);
    });

    it('should return false when member is a regular member', () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue({ ...mockPayload, polling_order_member_id: 999 });
      expect(service.isOrderAdmin(mockToken)).toBe(false);
    });

    it('should return false when token decodes to null', () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue(null);
      expect(service.isOrderAdmin(mockToken)).toBe(false);
    });
  });

  describe('isRecordOwner', () => {
    it('should return true when requesting member matches recordOwner', () => {
      expect(service.isRecordOwner(mockToken, 42)).toBe(true);
    });

    it('should return false when requesting member does not match recordOwner', () => {
      expect(service.isRecordOwner(mockToken, 99)).toBe(false);
    });
  });

  describe('getPollingOrderMemberId', () => {
    it('should return the polling_order_member_id from token', () => {
      const result = service.getPollingOrderMemberId(mockToken);
      expect(result).toBe(42);
    });

    it('should return the value as a Number', () => {
      const result = service.getPollingOrderMemberId(mockToken);
      expect(typeof result).toBe('number');
    });
  });

  describe('getPollingOrderId', () => {
    it('should return polling_order_id when present directly in token', () => {
      const result = service.getPollingOrderId(mockToken);
      expect(result).toBe(5);
    });

    it('should fall back to pollingOrderInfo.polling_order_id when direct field is missing', () => {
      const payloadWithoutDirectId = {
        polling_order_member_id: 42,
        pollingOrderInfo: {
          polling_order_id: 7,
          polling_order_admin: 42,
          polling_order_admin_assistant: 100
        }
      };
      jest.spyOn(jwtService, 'decode').mockReturnValue(payloadWithoutDirectId);
      const result = service.getPollingOrderId(mockToken);
      expect(result).toBe(7);
    });

    it('should throw when auth token is null', () => {
      expect(() => service.getPollingOrderId(null)).toThrow('Authentication token is required');
    });

    it('should throw when auth token is undefined', () => {
      expect(() => service.getPollingOrderId(undefined)).toThrow('Authentication token is required');
    });

    it('should throw when token cannot be decoded', () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue(null);
      expect(() => service.getPollingOrderId(mockToken)).toThrow('Invalid authentication token');
    });

    it('should throw when polling_order_id is not found anywhere in token', () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue({ polling_order_member_id: 42 });
      expect(() => service.getPollingOrderId(mockToken)).toThrow('Polling order ID not found in authentication token');
    });
  });

  describe('isMemberOfPollingOrder', () => {
    it('should return true when member belongs to the given polling order', () => {
      expect(service.isMemberOfPollingOrder(mockToken, 5)).toBe(true);
    });

    it('should return false when member belongs to a different polling order', () => {
      expect(service.isMemberOfPollingOrder(mockToken, 99)).toBe(false);
    });
  });
});
