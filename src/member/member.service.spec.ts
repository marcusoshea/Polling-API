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
import { passwordFingerprint } from '../auth/password-fingerprint';

// passwordFingerprint signs with JWT_SECRET; production loads it from the env file.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

jest.mock('nodemailer');
jest.mock('bcrypt');

const mockQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  leftJoinAndMapOne: jest.fn().mockReturnThis(),
  innerJoinAndMapOne: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  execute: jest.fn()
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
            getPollingOrderMemberId: jest.fn().mockReturnValue(1),
            getPollingOrderId: jest.fn().mockReturnValue(5)
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

  describe('getOrderClerk', () => {
    it('should not select the password or reset-token columns', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockMember });

      await service.getOrderClerk(5);

      // This route is reachable over the network, so the whole entity must not be
      // selected — doing so published the clerk's bcrypt hash and reset token.
      const selected = mockQueryBuilder.select.mock.calls[0][0];
      expect(selected).toEqual(expect.arrayContaining([
        'member.polling_order_member_id',
        'member.name',
        'member.email'
      ]));
      expect(selected.join(',')).not.toContain('password');
      expect(selected.join(',')).not.toContain('new_password_token');
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

    it('should reject an admin creating a member in a different polling order', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);

      await expect(service.forceCreateMember({
        name: 'X', email: 'x@example.com', password: 'p', polling_order_id: 6,
        pom_created_at: '2026-01-01', authToken: 'admin-token'
      } as any)).rejects.toThrow(UnauthorizedException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should store the email lowercased', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRepository.save.mockImplementation((m: any) => Promise.resolve(m));

      await service.forceCreateMember({
        name: 'X', email: 'New.Member@Example.com', password: 'p', polling_order_id: 5,
        pom_created_at: '2026-01-01', authToken: 'admin-token'
      } as any);

      expect(mockRepository.save.mock.calls[0][0].email).toBe('new.member@example.com');
    });
  });

  describe('deleteMember', () => {
    const deleteBody: any = {
      polling_order_member_id: 1,
      authToken: 'admin-token'
    };

    it('should delete member and return true when requester is order admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.findOneBy.mockResolvedValue(mockMember);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMember(deleteBody);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.deleteMember(deleteBody)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject an admin deleting a member of a different polling order', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(999);
      mockRepository.findOneBy.mockResolvedValue(mockMember);

      await expect(service.deleteMember(deleteBody)).rejects.toThrow(UnauthorizedException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should reject a missing member id without querying', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);

      // An undefined id would be dropped from the where clause and match anyone.
      await expect(service.deleteMember({ authToken: 'admin-token' } as any)).rejects.toThrow(UnauthorizedException);
      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAllMembersForCaller', () => {
    it('should return the roster for the caller own order', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockMember]);

      const result = await service.getAllMembersForCaller(5, 'Bearer member-token');

      expect(result).toEqual([mockMember]);
    });

    it('should reject a request for another order roster', async () => {
      await expect(service.getAllMembersForCaller(6, 'Bearer member-token')).rejects.toThrow(UnauthorizedException);
      expect(mockQueryBuilder.getMany).not.toHaveBeenCalled();
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

    it('should include a password fingerprint, not the hash, for the token', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMember);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.checkMemberCredentials('test@example.com', 'password123', 5);

      expect(result.pwv).toBe(passwordFingerprint('hashed_password'));
      expect(result.pwv).not.toContain('hashed_password');
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

    it('should generate a token across the full int4 range', async () => {
      mockRepository.update.mockResolvedValue({});

      const result = await service.createForgottenPasswordToken(mockMember as Member);

      expect(result.new_password_token).toBeGreaterThanOrEqual(100000000);
      expect(result.new_password_token).toBeLessThanOrEqual(2147483647);
    });

    it('should not repeat a token across calls', async () => {
      mockRepository.update.mockResolvedValue({});

      const seen = new Set<number>();
      for (let i = 0; i < 20; i++) {
        seen.add((await service.createForgottenPasswordToken({ ...mockMember } as Member)).new_password_token);
      }

      expect(seen.size).toBe(20);
    });
  });

  describe('resetPassword', () => {
    const validToken = 123456789;

    const matchedMember = (overrides: any = {}) => ({
      ...mockMember,
      new_password_token: validToken,
      new_password_token_timestamp: new Date(),
      ...overrides
    });

    // The token is a route parameter: POST /member/verify/:token
    const request = (token: any, body: any = { email: 'test@example.com', password: 'newpassword' }) =>
      ({ params: { token }, body });

    beforeEach(() => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
    });

    it('should update the password and return true for a current, matching token', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(matchedMember());

      const result = await service.resetPassword(request(validToken));

      expect(result).toBe(true);
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({ password: 'new_hashed_password' }));
    });

    it('should clear the token by setting new_password_token to 0', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(matchedMember());

      await service.resetPassword(request(validToken));

      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({ new_password_token: 0 }));
    });

    it('should look the member up by token as well as email', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(matchedMember());

      await service.resetPassword(request(validToken));

      // Regression: the token used to be read from req.token (undefined), and TypeORM
      // drops undefined conditions — so the lookup matched on email alone.
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('member.new_password_token = :token', { token: validToken });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(member.email) = :email', { email: 'test@example.com' });
    });

    it('should update every account on the address, case-insensitively', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(matchedMember());

      await service.resetPassword(request(validToken, { email: 'Test@Example.com', password: 'x' }));

      // The link proves inbox control, so the password follows the address into
      // every polling order.
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(Member);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('LOWER(email) = :email', { email: 'test@example.com' });
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should not copy this account join date onto the other accounts', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(matchedMember());

      await service.resetPassword(request(validToken));

      expect(mockQueryBuilder.set.mock.calls[0][0]).not.toHaveProperty('pom_created_at');
    });

    it('should reject a request with no token', async () => {
      await expect(
        service.resetPassword({ params: {}, body: { email: 'test@example.com', password: 'x' } })
      ).rejects.toThrow(UnauthorizedException);
      expect(mockQueryBuilder.getOne).not.toHaveBeenCalled();
    });

    it('should reject the 0 sentinel stored on accounts with no active reset', async () => {
      await expect(service.resetPassword(request(0))).rejects.toThrow(UnauthorizedException);
      expect(mockQueryBuilder.getOne).not.toHaveBeenCalled();
    });

    it('should reject a non-numeric token', async () => {
      await expect(service.resetPassword(request('abc'))).rejects.toThrow(UnauthorizedException);
      expect(mockQueryBuilder.getOne).not.toHaveBeenCalled();
    });

    it('should reject an expired token', async () => {
      const longAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      mockQueryBuilder.getOne.mockResolvedValue(
        matchedMember({ new_password_token_timestamp: longAgo })
      );

      await expect(service.resetPassword(request(validToken))).rejects.toThrow(UnauthorizedException);
      expect(mockQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('should reject a token with no recorded issue date', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(
        matchedMember({ new_password_token_timestamp: null })
      );

      await expect(service.resetPassword(request(validToken))).rejects.toThrow(UnauthorizedException);
      expect(mockQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('should lowercase the submitted email to match the LOWER() comparison', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(matchedMember());

      await service.resetPassword(request(validToken, { email: 'Test@Example.COM', password: 'x' }));

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(member.email) = :email', { email: 'test@example.com' });
    });

    it('should reject when no member matches the token', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.resetPassword(request(validToken))).rejects.toThrow(UnauthorizedException);
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
    it('should update only the authenticated account, by primary key', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockMember, email: 'Test@Example.com' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.changePassword({
        body: { email: 'test@example.com', password: 'old', newPassword: 'new', pollingOrderId: 5 }
      });

      // Keyed on email this matched nothing when the stored address had capitals,
      // and reached other orders' accounts on the same address.
      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ password: 'hashed' }));
    });

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

    it('should write to the route id and ignore polling_order_member_id in the body', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      // Regression: authorization is checked against the route id, so naming a
      // different member in the body used to let anyone edit anyone's record.
      await service.editMember({ ...editBody, polling_order_member_id: 99 }, 1);

      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.anything());
    });

    it('should reject an admin editing a member of a different polling order', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(false);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(999);

      await expect(service.editMember(editBody, 99)).rejects.toThrow(UnauthorizedException);
      expect(mockRepository.update).not.toHaveBeenCalled();
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
