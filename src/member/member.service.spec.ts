import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

import { MemberService } from './member.service';
import { Member } from './member.entity';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from '../auth/auth.service';

jest.mock('nodemailer');
jest.mock('bcrypt');

const mockQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  leftJoinAndMapOne: jest.fn().mockReturnThis(),
  innerJoinAndMapOne: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn()
};

const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findOneBy: jest.fn()
};

const mockMember: Partial<Member> = {
  polling_order_member_id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed_password',
  polling_order_id: 5,
  approved: true,
  removed: false,
  active: true,
  pom_created_at: new Date('2023-01-15')
};

describe('MemberService', () => {
  let service: MemberService;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: getRepositoryToken(Member),
          useValue: mockRepository
        },
        {
          provide: getRepositoryToken(PollingOrder),
          useValue: {}
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-jwt-token'),
            decode: jest.fn()
          }
        },
        {
          provide: AuthService,
          useValue: {
            isOrderAdmin: jest.fn().mockReturnValue(true),
            isRecordOwner: jest.fn().mockReturnValue(false),
            getPollingOrderMemberId: jest.fn().mockReturnValue(1)
          }
        }
      ]
    }).compile();

    service = module.get<MemberService>(MemberService);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllMembers', () => {
    it('should return all members for a polling order', async () => {
      const members = [mockMember];
      mockQueryBuilder.getMany.mockResolvedValue(members);

      const result = await service.getAllMembers(5);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('member');
      expect(result).toEqual(members);
    });
  });

  describe('getMember', () => {
    it('should return a member by email and order ID', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMember);

      const result = await service.getMember('test@example.com', 5);

      expect(result).toEqual(mockMember);
    });

    it('should return null when member is not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.getMember('notfound@example.com', 5);

      expect(result).toBeNull();
    });
  });

  describe('getMemberById', () => {
    it('should return a member by ID with polling order joined', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMember);

      const result = await service.getMemberById(1);

      expect(result).toEqual(mockMember);
      expect(mockQueryBuilder.leftJoinAndMapOne).toHaveBeenCalled();
    });
  });

  describe('forceCreateMember', () => {
    const forceCreateBody: any = {
      name: 'Force User',
      email: 'force@example.com',
      password: 'password123',
      polling_order_id: 5,
      pom_created_at: '2023-01-01',
      authToken: 'admin-token',
      approved: true
    };

    it('should create a member when requester is order admin', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockRepository.save.mockResolvedValue({ ...forceCreateBody, polling_order_member_id: 2 });
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);

      const result = await service.forceCreateMember(forceCreateBody);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should hash the password before saving', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      mockRepository.save.mockResolvedValue({ polling_order_member_id: 2 });
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);

      await service.forceCreateMember(forceCreateBody);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.forceCreateMember(forceCreateBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteMember', () => {
    const deleteBody: any = {
      polling_order_member_id: 1,
      authToken: 'admin-token'
    };

    it('should delete member and return true when requester is order admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMember(deleteBody);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.deleteMember(deleteBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('checkMemberCredentials', () => {
    it('should return member data without password when credentials are valid', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMember);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.checkMemberCredentials('test@example.com', 'password123', 5);

      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('Test User');
    });

    it('should return false when password is incorrect', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMember);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.checkMemberCredentials('test@example.com', 'wrongpassword', 5);

      expect(result).toBe(false);
    });

    it('should return false when member is not approved', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockMember, approved: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.checkMemberCredentials('test@example.com', 'password123', 5);

      expect(result).toBe(false);
    });

    it('should return false when member is removed', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockMember, removed: true });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.checkMemberCredentials('test@example.com', 'password123', 5);

      expect(result).toBe(false);
    });
  });

  describe('loginWithCredentials', () => {
    const loginReq = {
      body: {
        email: 'test@example.com',
        password: 'password123',
        polling_order_id: 5
      }
    };

    it('should return access token and user info on successful login', async () => {
      const memberData = { ...mockMember };
      delete (memberData as any).password;
      jest.spyOn(service, 'checkMemberCredentials').mockResolvedValue(memberData);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      const result = await service.loginWithCredentials(loginReq);

      expect(result.access_token).toBe('signed-jwt-token');
      expect(result.name).toBe('Test User');
      expect(result.email).toBe('test@example.com');
      expect(result.memberId).toBe(1);
    });

    it('should include isOrderAdmin flag in the response', async () => {
      const memberData = { ...mockMember };
      delete (memberData as any).password;
      jest.spyOn(service, 'checkMemberCredentials').mockResolvedValue(memberData);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);

      const result = await service.loginWithCredentials(loginReq);

      expect(result.isOrderAdmin).toBe(true);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'checkMemberCredentials').mockResolvedValue(false);

      await expect(service.loginWithCredentials(loginReq)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createForgottenPasswordToken', () => {
    it('should set a new_password_token and timestamp on the member', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.createForgottenPasswordToken(mockMember as Member);

      expect(result.new_password_token).toBeDefined();
      expect(result.new_password_token_timestamp).toBeInstanceOf(Date);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should generate a 7-digit token between 1000000 and 9999999', async () => {
      mockRepository.update.mockResolvedValue({});

      const result = await service.createForgottenPasswordToken(mockMember as Member);

      expect(result.new_password_token).toBeGreaterThanOrEqual(1000000);
      expect(result.new_password_token).toBeLessThanOrEqual(9999999);
    });
  });

  describe('resetPassword', () => {
    it('should update password and return true when token matches member', async () => {
      mockRepository.findOneBy.mockResolvedValue({ ...mockMember, new_password_token: 1234567 });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.resetPassword({
        token: 1234567,
        body: { email: 'test@example.com', password: 'newpassword' }
      });

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should clear the token by setting new_password_token to 0', async () => {
      mockRepository.findOneBy.mockResolvedValue({ ...mockMember, new_password_token: 1234567 });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRepository.update.mockResolvedValue({});

      await service.resetPassword({
        token: 1234567,
        body: { email: 'test@example.com', password: 'newpassword' }
      });

      const updateCall = mockRepository.update.mock.calls[0][1];
      expect(updateCall.new_password_token).toBe(0);
    });

    it('should return false when token does not match any member', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.resetPassword({
        token: 9999999,
        body: { email: 'test@example.com', password: 'newpassword' }
      });

      expect(result).toBe(false);
    });
  });

  describe('sendEmailForgotPassword', () => {
    it('should throw HttpException NOT_FOUND when member does not exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.sendEmailForgotPassword({
          body: { email: 'missing@example.com', polling_order_id: 5 }
        })
      ).rejects.toThrow(HttpException);
    });
  });

  describe('changePassword', () => {
    const changeReq = {
      body: {
        email: 'test@example.com',
        password: 'currentPass',
        newPassword: 'newPass',
        pollingOrderId: 5
      }
    };

    it('should update password and return true on valid credentials', async () => {
      const memberData = { ...mockMember, pom_created_at: new Date('2023-01-15') };
      delete (memberData as any).password;
      jest.spyOn(service, 'checkMemberCredentials').mockResolvedValue(memberData);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changePassword(changeReq);

      expect(result).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current credentials are invalid', async () => {
      jest.spyOn(service, 'checkMemberCredentials').mockResolvedValue(false);

      await expect(service.changePassword(changeReq)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createMember', () => {
    const createBody: any = {
      name: 'New Member',
      email: 'new@example.com',
      password: 'password123',
      polling_order_id: 5,
      pom_created_at: '2023-01-01'
    };

    const orderClerk = {
      email: 'clerk@example.com',
      pollingOrderInfo: { polling_order_name: 'Test Order' }
    };

    beforeEach(() => {
      (require('nodemailer').createTransport as jest.Mock).mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
      });
    });

    it('should create a member when email does not already exist', async () => {
      jest.spyOn(service, 'getOrderClerk').mockResolvedValue(orderClerk as any);
      jest.spyOn(service, 'getMember').mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockRepository.save.mockResolvedValue({ polling_order_member_id: 10, ...createBody });

      const result = await service.createMember(createBody);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should lowercase the email before saving', async () => {
      jest.spyOn(service, 'getOrderClerk').mockResolvedValue(orderClerk as any);
      jest.spyOn(service, 'getMember').mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRepository.save.mockImplementation(m => Promise.resolve(m));

      const result = await service.createMember({ ...createBody, email: 'NEW@EXAMPLE.COM' });

      expect(result.email).toBe('new@example.com');
    });

    it('should throw HttpException when email already exists in the order', async () => {
      jest.spyOn(service, 'getOrderClerk').mockResolvedValue(orderClerk as any);
      jest.spyOn(service, 'getMember').mockResolvedValue({ email: 'new@example.com' } as any);

      await expect(service.createMember(createBody)).rejects.toThrow('Account exists already.');
    });
  });

  describe('editMember', () => {
    const editBody: any = {
      polling_order_member_id: 1,
      polling_order_id: 5,
      email: 'updated@example.com',
      name: 'Updated Name',
      approved: true,
      removed: false,
      active: true,
      authToken: 'user-token'
    };

    beforeEach(() => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMember);
      (require('nodemailer').createTransport as jest.Mock).mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
      });
    });

    it('should update own profile when requester is record owner', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.editMember(editBody, 1);

      expect(mockRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should update member when requester is admin (not record owner)', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(false);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      jest.spyOn(service, 'getOrderClerk').mockResolvedValue({
        email: 'clerk@example.com',
        pollingOrderInfo: { polling_order_name: 'Test Order' }
      } as any);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.editMember(editBody, 99);

      expect(mockRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is neither owner nor admin', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(false);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.editMember(editBody, 99)).rejects.toThrow(UnauthorizedException);
    });

    it('should use approved/removed from body when admin edits another member', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(false);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      jest.spyOn(service, 'getOrderClerk').mockResolvedValue({
        email: 'clerk@example.com',
        pollingOrderInfo: { polling_order_name: 'Test Order' }
      } as any);
      mockRepository.update.mockResolvedValue({});

      await service.editMember({ ...editBody, removed: false }, 99);

      const updateCall = mockRepository.update.mock.calls[0][1];
      expect(updateCall.approved).toBe(true);
    });
  });
});
