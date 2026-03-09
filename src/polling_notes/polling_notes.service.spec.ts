import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PollingNotesService } from './polling_notes.service';
import { PollingNotes } from './polling_notes.entity';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { Member } from '../member/member.entity';
import { AuthService } from '../auth/auth.service';

const mockQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn()
};

const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('PollingNotesService', () => {
  let service: PollingNotesService;
  let authService: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollingNotesService,
        {
          provide: getRepositoryToken(PollingNotes),
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
            isOrderAdmin: jest.fn().mockReturnValue(true),
            isRecordOwner: jest.fn().mockReturnValue(true),
            getPollingOrderMemberId: jest.fn().mockReturnValue(42)
          }
        }
      ]
    }).compile();

    service = module.get<PollingNotesService>(PollingNotesService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPollingNoteById', () => {
    it('should return a polling note by polling_id', async () => {
      const note = { polling_notes_id: 1, polling_id: 5 };
      mockRepository.findOneBy.mockResolvedValue(note);

      const result = await service.getPollingNoteById(5);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ polling_id: 5 });
      expect(result).toEqual(note);
    });
  });

  describe('getAllPollingNotesById', () => {
    it('should return notes for admin (without private filter)', async () => {
      const body: any = { polling_notes_id: 1, authToken: 'admin-token' };
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);

      const adminNotes = [{ polling_notes_id: 1, note: 'Admin note' }];
      // First getRawMany returns polling_order_notes_time_visible
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ pv: 3 }])   // visibility query
        .mockResolvedValueOnce(adminNotes);     // notes query

      const result = await service.getAllPollingNotesById(body);

      expect(result).toEqual(adminNotes);
    });

    it('should return notes for regular member (with private=false filter)', async () => {
      const body: any = { polling_notes_id: 1, authToken: 'member-token' };
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      const memberNotes = [{ polling_notes_id: 2, note: 'Public note', private: false }];
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ pv: 6 }])
        .mockResolvedValueOnce(memberNotes);

      const result = await service.getAllPollingNotesById(body);

      expect(result).toEqual(memberNotes);
    });

    it('should return undefined when no visibility data found', async () => {
      const body: any = { polling_notes_id: 1, authToken: 'token' };
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([]);

      const result = await service.getAllPollingNotesById(body);

      expect(result).toBeUndefined();
    });
  });

  describe('createPollingNote', () => {
    const baseNote = {
      authToken: 'member-token',
      polling_notes_id: null,
      note: 'Test note',
      vote: 1,
      polling_id: 10,
      candidate_id: 5,
      polling_order_id: 1,
      polling_order_member_id: 42,
      completed: false,
      private: false
    };

    it('should save a new note when no existing note found', async () => {
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({ polling_notes_id: 1, ...baseNote });

      const result = await service.createPollingNote([baseNote] as any);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should update existing note when polling_notes_id is provided', async () => {
      const noteWithId = { ...baseNote, polling_notes_id: 99 };
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.createPollingNote([noteWithId] as any);

      expect(mockRepository.update).toHaveBeenCalledWith(99, expect.any(Object));
      expect(result).toBe(true);
    });

    it('should update existing note when duplicate found without polling_notes_id', async () => {
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      const existingNote = { ...baseNote, polling_notes_id: 77 };
      mockRepository.findOne.mockResolvedValue(existingNote);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.createPollingNote([baseNote] as any);

      expect(mockRepository.update).toHaveBeenCalledWith(77, expect.any(Object));
      expect(result).toBe(true);
    });

    it('should set note to null when note is empty', async () => {
      const emptyNote = { ...baseNote, note: '' };
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockImplementation(n => Promise.resolve(n));

      await service.createPollingNote([emptyNote] as any);

      const savedNote = mockRepository.save.mock.calls[0][0];
      expect(savedNote.note).toBeNull();
    });

    it('should use body memberId when requester is admin voting on behalf of another member', async () => {
      const adminOverrideNote = { ...baseNote, polling_order_member_id: 99 };
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockImplementation(n => Promise.resolve(n));

      await service.createPollingNote([adminOverrideNote] as any);

      const savedNote = mockRepository.save.mock.calls[0][0];
      expect(savedNote.polling_order_member_id).toBe(99);
    });
  });

  describe('editPollingNote', () => {
    const editBody: any = {
      polling_notes_id: 1,
      note: 'Updated note',
      vote: 2,
      candidate_id: 5,
      completed: true,
      authToken: 'member-token'
    };

    it('should update note and return true when requester is record owner', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.editPollingNote(editBody, 42);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        note: 'Updated note',
        vote: 2,
        candidate_id: 5,
        completed: true
      });
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not record owner', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(false);

      await expect(service.editPollingNote(editBody, 99)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deletePollingNote', () => {
    const deleteBody: any = {
      polling_notes_id: 1,
      authToken: 'admin-token'
    };

    it('should delete note and return true when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deletePollingNote(deleteBody);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.deletePollingNote(deleteBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getPollingReportTotals', () => {
    it('should return vote totals for a polling', async () => {
      const totals = [{ name: 'Candidate A', vote: 'Yes', total: '5' }];
      mockQueryBuilder.getRawMany.mockResolvedValue(totals);

      const result = await service.getPollingReportTotals(10);

      expect(result).toEqual(totals);
    });
  });

  describe('getPollingReportMemberParticipation', () => {
    it('should return member participation count for a polling', async () => {
      const participation = [{ member_participation: '15' }];
      mockQueryBuilder.getRawMany.mockResolvedValue(participation);

      const result = await service.getPollingReportMemberParticipation(10);

      expect(result).toEqual(participation);
    });
  });
});
