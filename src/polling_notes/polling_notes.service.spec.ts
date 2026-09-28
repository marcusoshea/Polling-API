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
  delete: jest.fn(),
  // createPollingNote reads the order's allow-anonymous flag via repository.manager.
  manager: {
    getRepository: jest.fn().mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: true })
    })
  }
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

    it('should select the real member name (no anonymous masking) for admins', async () => {
      const body: any = { polling_notes_id: 1, authToken: 'admin-token' };
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ pv: 3 }])
        .mockResolvedValueOnce([]);

      await service.getAllPollingNotesById(body);

      const arraySelect = mockQueryBuilder.select.mock.calls.map((c: any[]) => c[0]).find((a: any) => Array.isArray(a));
      expect(arraySelect[1]).toBe('t2.name as member_name');
    });

    it('should mask the member name via CASE for non-admins', async () => {
      const body: any = { polling_notes_id: 1, authToken: 'member-token' };
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ pv: 6 }])
        .mockResolvedValueOnce([]);

      await service.getAllPollingNotesById(body);

      const arraySelect = mockQueryBuilder.select.mock.calls.map((c: any[]) => c[0]).find((a: any) => Array.isArray(a));
      expect(arraySelect[1]).toContain("'Anonymous'");
      expect(arraySelect[1]).toContain('t1.anonymous');
      // non-admins are still restricted to non-private notes
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('t1.private = false');
    });

    it('should strip the member id on other members anonymous notes for non-admins', async () => {
      const body: any = { polling_notes_id: 1, authToken: 'member-token' };
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(99);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ pv: 6 }])
        .mockResolvedValueOnce([
          { anonymous: true, polling_order_member_id: 7 },
          { anonymous: true, polling_order_member_id: 99 },
          { anonymous: false, polling_order_member_id: 8 }
        ]);

      const result: any = await service.getAllPollingNotesById(body);

      // someone else's anonymous note: id removed (it is joinable against the roster)
      expect(result[0].polling_order_member_id).toBeNull();
      // the requester's own anonymous note: id kept so owner-only controls still work
      expect(result[1].polling_order_member_id).toBe(99);
      // non-anonymous notes are untouched
      expect(result[2].polling_order_member_id).toBe(8);
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

    describe('anonymous order-flag enforcement', () => {
      it('should persist anonymous=true when the order allows anonymity', async () => {
        mockRepository.manager.getRepository.mockReturnValueOnce({
          findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: true })
        });
        jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
        jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
        mockRepository.findOne.mockResolvedValue(null);
        mockRepository.save.mockImplementation(n => Promise.resolve(n));

        await service.createPollingNote([{ ...baseNote, anonymous: true, private: false }] as any);

        const savedNote = mockRepository.save.mock.calls[0][0];
        expect(savedNote.anonymous).toBe(true);
      });

      it('should force anonymous=false when the order disallows anonymity', async () => {
        mockRepository.manager.getRepository.mockReturnValueOnce({
          findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: false })
        });
        jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
        jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
        mockRepository.findOne.mockResolvedValue(null);
        mockRepository.save.mockImplementation(n => Promise.resolve(n));

        await service.createPollingNote([{ ...baseNote, anonymous: true, private: false }] as any);

        const savedNote = mockRepository.save.mock.calls[0][0];
        expect(savedNote.anonymous).toBe(false);
      });

      it('should keep anonymous and private mutually exclusive (anonymous wins)', async () => {
        mockRepository.manager.getRepository.mockReturnValueOnce({
          findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: true })
        });
        jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
        jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);
        mockRepository.findOne.mockResolvedValue(null);
        mockRepository.save.mockImplementation(n => Promise.resolve(n));

        await service.createPollingNote([{ ...baseNote, anonymous: true, private: true }] as any);

        const savedNote = mockRepository.save.mock.calls[0][0];
        expect(savedNote.anonymous).toBe(true);
        expect(savedNote.private).toBe(false);
      });
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

    it('should persist anonymous and force private=false when editing an anonymous note', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      mockRepository.manager.getRepository.mockReturnValueOnce({
        findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: true })
      });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.editPollingNote({ ...editBody, anonymous: true, private: true }, 42);

      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ anonymous: true, private: false }));
    });

    it('should force anonymous=false on edit when the order disallows anonymity', async () => {
      jest.spyOn(authService, 'isRecordOwner').mockReturnValue(true);
      mockRepository.manager.getRepository.mockReturnValueOnce({
        findOneBy: jest.fn().mockResolvedValue({ polling_order_allow_anonymous: false })
      });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.editPollingNote({ ...editBody, anonymous: true, private: true }, 42);

      // the policy is re-checked on edit, so create-then-edit cannot escape it
      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ anonymous: false, private: true }));
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
