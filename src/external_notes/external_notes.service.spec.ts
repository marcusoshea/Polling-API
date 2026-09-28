import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ExternalNotesService } from './external_notes.service';
import { ExternalNotes } from './external_notes.entity';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { Member } from '../member/member.entity';
import { AuthService } from '../auth/auth.service';

const mockQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  innerJoinAndMapOne: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getMany: jest.fn()
};

const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  findOneBy: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  // createExternalNote reads the order's allow-anonymous flag via repository.manager.
  manager: {
    getRepository: jest.fn().mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: true })
    })
  }
};

describe('ExternalNotesService', () => {
  let service: ExternalNotesService;
  let authService: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalNotesService,
        {
          provide: getRepositoryToken(ExternalNotes),
          useValue: mockRepository
        },
        {
          provide: getRepositoryToken(PollingOrder),
          useValue: {}
        },
        {
          provide: getRepositoryToken(Member),
          useValue: {}
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), decode: jest.fn() }
        },
        {
          provide: AuthService,
          useValue: {
            isOrderAdmin: jest.fn().mockReturnValue(false),
            isRecordOwner: jest.fn().mockReturnValue(true),
            getPollingOrderMemberId: jest.fn().mockReturnValue(42),
            getPollingOrderId: jest.fn().mockReturnValue(5)
          }
        }
      ]
    }).compile();

    service = module.get<ExternalNotesService>(ExternalNotesService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExternalNote', () => {
    const baseBody: any = {
      external_note: 'A note',
      candidate_id: 7,
      polling_order_member_id: 42,
      en_created_at: '2026-01-01',
      anonymous: true,
      authToken: 'token'
    };

    it('should persist anonymous=true when the order allows anonymity', async () => {
      mockRepository.manager.getRepository.mockReturnValueOnce({
        findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: true })
      });
      mockRepository.save.mockImplementation(n => Promise.resolve(n));

      await service.createExternalNote(baseBody);

      const saved = mockRepository.save.mock.calls[0][0];
      expect(saved.anonymous).toBe(true);
      expect(saved.polling_order_member_id).toBe(42);
    });

    it('should force anonymous=false when the order disallows anonymity', async () => {
      mockRepository.manager.getRepository.mockReturnValueOnce({
        findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: false })
      });
      mockRepository.save.mockImplementation(n => Promise.resolve(n));

      await service.createExternalNote(baseBody);

      const saved = mockRepository.save.mock.calls[0][0];
      expect(saved.anonymous).toBe(false);
    });
  });

  describe('getExternalNoteByCandidateId', () => {
    const anonNote = () => ({
      external_notes_id: 1,
      anonymous: true,
      polling_order_member_id: { polling_order_member_id: 7, name: 'Jane Smith', email: 'jane@example.com' }
    });

    it('should keep the real author for admins on anonymous notes', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ pv: 6 }]);
      mockQueryBuilder.getMany.mockResolvedValue([anonNote()]);

      const result: any = await service.getExternalNoteByCandidateId(7, 'Bearer admin-token');

      expect(result[0].polling_order_member_id.name).toBe('Jane Smith');
    });

    it('should strip the author and the member id for non-admins on someone elses anonymous note', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(99);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ pv: 6 }]);
      mockQueryBuilder.getMany.mockResolvedValue([anonNote()]);

      const result: any = await service.getExternalNoteByCandidateId(7, 'Bearer member-token');

      expect(result[0].polling_order_member_id.name).toBe('Anonymous');
      expect(result[0].polling_order_member_id.email).toBeUndefined();
      // The id must go too — it is joinable against GET /member/all/:id to recover the author.
      expect(result[0].polling_order_member_id.polling_order_member_id).toBeNull();
    });

    it('should keep the member id on the requesters own anonymous note so delete still works', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(7);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ pv: 6 }]);
      mockQueryBuilder.getMany.mockResolvedValue([anonNote()]);

      const result: any = await service.getExternalNoteByCandidateId(7, 'Bearer owner-token');

      expect(result[0].polling_order_member_id.name).toBe('Anonymous');
      expect(result[0].polling_order_member_id.polling_order_member_id).toBe(7);
    });

    it('should not alter the author for non-anonymous notes', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ pv: 6 }]);
      mockQueryBuilder.getMany.mockResolvedValue([
        { external_notes_id: 2, anonymous: false, polling_order_member_id: { polling_order_member_id: 8, name: 'Bob' } }
      ]);

      const result: any = await service.getExternalNoteByCandidateId(7, 'Bearer member-token');

      expect(result[0].polling_order_member_id.name).toBe('Bob');
    });
  });

  describe('editExternalNote', () => {
    const editBody: any = {
      external_notes_id: 1,
      external_note: 'Updated',
      candidate_id: 5,
      polling_order_member_id: 42,
      anonymous: true,
      authToken: 'member-token'
    };

    it('should force anonymous=false on edit when the order disallows anonymity', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(3);
      mockRepository.manager.getRepository.mockReturnValueOnce({
        findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: false })
      });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.editExternalNote(editBody, 42);

      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ anonymous: false }));
    });

    it('should persist anonymous=true on edit when the order allows anonymity', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(3);
      mockRepository.manager.getRepository.mockReturnValueOnce({
        findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: true })
      });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.editExternalNote(editBody, 42);

      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ anonymous: true }));
    });
  });

  describe('deleteExternalNote', () => {
    const deleteBody: any = { external_notes_id: 1, polling_order_member_id: 42, authToken: 'token' };

    it('should delete when requester is the record owner', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteExternalNote(deleteBody);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is neither admin nor owner', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(false);

      await expect(service.deleteExternalNote(deleteBody)).rejects.toThrow(UnauthorizedException);
    });
  });
});
