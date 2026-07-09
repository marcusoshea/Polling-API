import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';

import { PollingService } from './polling.service';
import { Polling } from './polling.entity';
import { PollingCandidate } from './polling_candidate.entity';
import { PollingNotes } from '../polling_notes/polling_notes.entity';
import { Candidate } from '../candidate/candidate.entity';
import { Member } from '../member/member.entity';
import { PollingOrder } from '../polling_order/polling_order.entity';
import { AuthService } from '../auth/auth.service';
import { TypeOrmConfigService } from '../shared/typeorm/typeorm.service';
import { PollingNotesService } from '../polling_notes/polling_notes.service';
import { MemberService } from '../member/member.service';

const mockQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  innerJoinAndMapOne: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({ raw: [] }),
  getMany: jest.fn(),
  getRawMany: jest.fn(),
  getRawOne: jest.fn(),
  getOne: jest.fn()
};

// Separate query builder for the candidate scope-check lookup so its
// getRawOne can be mocked independently of the aggregate query builder.
const mockCandidateQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn()
};

const mockRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  findOneBy: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  manager: {
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(mockCandidateQueryBuilder)
    })
  }
};

const mockPolling: Partial<Polling> = {
  polling_id: 1,
  polling_name: 'Test Polling',
  polling_order_id: 5,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

describe('PollingService', () => {
  let service: PollingService;
  let authService: AuthService;
  let pollingNotesService: PollingNotesService;
  let memberService: MemberService;

  const mockDataSource = {
    initialize: jest.fn().mockResolvedValue({
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder)
    })
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollingService,
        {
          provide: getRepositoryToken(Polling),
          useValue: mockRepository
        },
        {
          provide: getRepositoryToken(PollingNotes),
          useValue: {}
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: {}
        },
        {
          provide: getRepositoryToken(Member),
          useValue: {}
        },
        {
          provide: getRepositoryToken(PollingCandidate),
          useValue: {}
        },
        {
          provide: getRepositoryToken(PollingOrder),
          useValue: {}
        },
        {
          provide: AuthService,
          useValue: {
            isOrderAdmin: jest.fn().mockReturnValue(true),
            getPollingOrderId: jest.fn().mockReturnValue(5),
            getPollingOrderMemberId: jest.fn().mockReturnValue(42)
          }
        },
        {
          provide: TypeOrmConfigService,
          useValue: {
            workDataSource: jest.fn().mockReturnValue(mockDataSource)
          }
        },
        {
          provide: PollingNotesService,
          useValue: {
            getPollingReportMemberParticipation: jest.fn().mockResolvedValue([{ member_participation: '10' }])
          }
        },
        {
          provide: MemberService,
          useValue: {
            getAllMembers: jest.fn().mockResolvedValue([])
          }
        }
      ]
    }).compile();

    service = module.get<PollingService>(PollingService);
    authService = module.get<AuthService>(AuthService);
    pollingNotesService = module.get<PollingNotesService>(PollingNotesService);
    memberService = module.get<MemberService>(MemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPollingById', () => {
    it('should return a polling by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockPolling);

      const result = await service.getPollingById(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ polling_id: 1 });
      expect(result).toEqual(mockPolling);
    });

    it('should return null when polling not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getPollingById(999);

      expect(result).toBeNull();
    });
  });

  describe('createPolling', () => {
    const createBody: any = {
      name: 'New Polling',
      polling_order_id: 5,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      authToken: 'admin-token'
    };

    it('should create and return a polling when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.save.mockResolvedValue({ ...mockPolling, polling_id: 2 });

      const result = await service.createPolling(createBody);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should set correct fields on the new polling', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.save.mockImplementation(p => Promise.resolve({ ...p, polling_id: 2 }));

      const result = await service.createPolling(createBody);

      expect(result.polling_name).toBe('New Polling');
      expect(result.polling_order_id).toBe(5);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.createPolling(createBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('editPolling', () => {
    const editBody: any = {
      polling_id: 1,
      name: 'Updated Polling',
      start_date: '2024-02-01',
      end_date: '2024-11-30',
      authToken: 'admin-token'
    };

    it('should update polling and return true when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.editPolling(editBody);

      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        polling_name: 'Updated Polling',
        start_date: '2024-02-01',
        end_date: '2024-11-30'
      });
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.editPolling(editBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deletePolling', () => {
    const deleteBody: any = {
      polling_id: 1,
      authToken: 'admin-token'
    };

    it('should return true immediately when requester is admin (async delete)', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);

      const result = await service.deletePolling(deleteBody);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.deletePolling(deleteBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllPollings', () => {
    it('should return all pollings for an order sorted by name', async () => {
      const pollings = [mockPolling];
      mockQueryBuilder.getMany.mockResolvedValue(pollings);

      const result = await service.getAllPollings(5);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('polling');
      expect(result).toEqual(pollings);
    });

    it('should return empty array when no pollings exist', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getAllPollings(99);

      expect(result).toEqual([]);
    });
  });

  describe('getCurrentPolling', () => {
    it('should return the current polling for an order', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(mockPolling);

      const result = await service.getCurrentPolling(5);

      expect(result).toEqual(mockPolling);
    });

    it('should return null when no current polling', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.getCurrentPolling(5);

      expect(result).toBeNull();
    });
  });

  describe('addPollingCandidates', () => {
    const candidates: any[] = [
      { polling_id: 1, candidate_id: 10, authToken: 'admin-token' }
    ];

    it('should insert candidates and return raw result when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockQueryBuilder.execute.mockResolvedValue({ raw: [{ polling_candidate_id: 1 }] });

      const result = await service.addPollingCandidates(candidates);

      expect(result).toEqual([{ polling_candidate_id: 1 }]);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.addPollingCandidates(candidates)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('removePollingCandidate', () => {
    const removeBody: any = {
      polling_candidate_id: 5,
      authToken: 'admin-token'
    };

    it('should remove candidate and return true when requester is admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(true);
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await service.removePollingCandidate(removeBody);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when requester is not admin', async () => {
      jest.spyOn(authService, 'isOrderAdmin').mockReturnValue(false);

      await expect(service.removePollingCandidate(removeBody)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getCandidateTrend', () => {
    it('should return points ordered by end_date ASC with correct rating math', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      // Candidate belongs to requester's order (5)
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 5 });

      // Raw rows come back already ordered by end_date ASC (DB does the ordering).
      // Counts as strings to mirror TypeORM raw output; verify coercion to numbers.
      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          polling_id: '1',
          polling_name: 'Winter Polling',
          end_date: new Date('2026-01-31'),
          yes: '4',
          wait: '1',
          no: '0',
          abstain: '0',
          total: '5'
        },
        {
          polling_id: '2',
          polling_name: 'Spring Polling',
          end_date: new Date('2026-04-30'),
          yes: '8',
          wait: '2',
          no: '1',
          abstain: '3',
          total: '14'
        }
      ]);

      const result = await service.getCandidateTrend(1, 'Bearer token');

      // Ordering preserved (Winter before Spring)
      expect(result.map(r => r.polling_name)).toEqual(['Winter Polling', 'Spring Polling']);

      // Rating math: 8 / (8+2+1) * 100 = 72.727... -> 72.73
      expect(result[1].rating).toBe(72.73);
      // Counts coerced to numbers
      expect(result[1].yes).toBe(8);
      expect(result[1].wait).toBe(2);
      expect(result[1].no).toBe(1);
      expect(result[1].abstain).toBe(3);
      expect(result[1].total).toBe(14);
      expect(result[1].polling_id).toBe(2);
    });

    it('should return rating null when only abstain votes exist (denominator 0)', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 5 });

      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          polling_id: '3',
          polling_name: 'All Abstain Polling',
          end_date: new Date('2026-05-31'),
          yes: '0',
          wait: '0',
          no: '0',
          abstain: '5',
          total: '5'
        }
      ]);

      const result = await service.getCandidateTrend(1, 'Bearer token');

      expect(result[0].rating).toBeNull();
      expect(result[0].abstain).toBe(5);
      expect(result[0].total).toBe(5);
    });

    it('should filter to completed=true in the query', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 5 });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getCandidateTrend(1, 'Bearer token');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('t2.completed = true');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('t1.end_date', 'ASC');
    });

    it('should return empty array for a candidate in a different polling order', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      // Candidate belongs to order 99, not requester's order 5
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 99 });

      const result = await service.getCandidateTrend(1, 'Bearer token');

      expect(result).toEqual([]);
      // Aggregate query should never run for a cross-order candidate
      expect(mockQueryBuilder.getRawMany).not.toHaveBeenCalled();
    });

    it('should return empty array when the candidate does not exist', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue(undefined);

      const result = await service.getCandidateTrend(999, 'Bearer token');

      expect(result).toEqual([]);
    });
  });

  describe('getMyNotesByCandidateId', () => {
    it('should return only the requesting member\'s notes, derived from the token (not a param)', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 5 });

      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          polling_id: '12',
          polling_name: 'Spring Polling',
          end_date: new Date('2026-04-30'),
          vote: '1',
          note: 'Strong progress',
          private: false,
          completed: true,
          pn_created_at: new Date('2026-04-10')
        }
      ]);

      const result = await service.getMyNotesByCandidateId(7, 'Bearer token');

      // member id comes from the token, filtered in the query
      expect(authService.getPollingOrderMemberId).toHaveBeenCalledWith('token');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        't1.polling_order_member_id = :memberId',
        { memberId: 42 }
      );
      expect(result).toHaveLength(1);
      expect(result[0].polling_id).toBe(12);
      expect(result[0].vote).toBe(1);
      expect(result[0].note).toBe('Strong progress');
      expect(result[0].polling_name).toBe('Spring Polling');
    });

    it('should include the member\'s own private notes (no private filter applied)', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 5 });

      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          polling_id: '9',
          polling_name: 'Private Polling',
          end_date: new Date('2026-02-28'),
          vote: '2',
          note: 'my private thoughts',
          private: true,
          completed: true,
          pn_created_at: new Date('2026-02-10')
        }
      ]);

      const result = await service.getMyNotesByCandidateId(7, 'Bearer token');

      // A private note IS returned...
      expect(result).toHaveLength(1);
      expect(result[0].private).toBe(true);
      // ...and no private filter was ever added to the query.
      const privateFilterUsed = mockQueryBuilder.andWhere.mock.calls.some(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('private')
      );
      expect(privateFilterUsed).toBe(false);
    });

    it('should filter to completed=true in the query', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 5 });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getMyNotesByCandidateId(7, 'Bearer token');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('t1.completed = true');
    });

    it('should order by end_date DESC', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 5 });
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getMyNotesByCandidateId(7, 'Bearer token');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('t2.end_date', 'DESC');
    });

    it('should return empty array for a candidate in a different polling order and not run the notes query', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      // Candidate belongs to order 99, not requester's order 5
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue({ polling_order_id: 99 });

      const result = await service.getMyNotesByCandidateId(7, 'Bearer token');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getRawMany).not.toHaveBeenCalled();
    });

    it('should return empty array when the candidate does not exist', async () => {
      jest.spyOn(authService, 'getPollingOrderId').mockReturnValue(5);
      jest.spyOn(authService, 'getPollingOrderMemberId').mockReturnValue(42);
      mockCandidateQueryBuilder.getRawOne.mockResolvedValue(undefined);

      const result = await service.getMyNotesByCandidateId(999, 'Bearer token');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.getRawMany).not.toHaveBeenCalled();
    });
  });

  describe('getMissingVotesReport', () => {
    it('should return missing votes report with empty members when all voted', async () => {
      const pollings = [
        { polling_id: 1, polling_name: 'Poll 1' },
        { polling_id: 2, polling_name: 'Poll 2' }
      ];
      mockQueryBuilder.getMany.mockResolvedValue(pollings);

      const activeMembers = [
        { polling_order_member_id: 1, name: 'Member 1', active: true },
        { polling_order_member_id: 2, name: 'Member 2', active: true }
      ];
      jest.spyOn(memberService, 'getAllMembers').mockResolvedValue(activeMembers as any);

      // Mock pollingNotesService repository access (private field)
      const notesRepoMock = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { polling_order_member_id: 1 },
            { polling_order_member_id: 2 }
          ])
        })
      };
      (service as any).pollingNotesService['repository'] = notesRepoMock;

      const result = await service.getMissingVotesReport(5, 2);

      expect(result).toHaveLength(1);
      expect(result[0].pollings).toHaveLength(2);
      expect(result[0].missing_in_all).toHaveLength(0);
    });

    it('should identify members missing from all pollings', async () => {
      const pollings = [{ polling_id: 1, polling_name: 'Poll 1' }];
      mockQueryBuilder.getMany.mockResolvedValue(pollings);

      const activeMembers = [
        { polling_order_member_id: 1, name: 'Member 1', active: true },
        { polling_order_member_id: 2, name: 'Missing Member', active: true }
      ];
      jest.spyOn(memberService, 'getAllMembers').mockResolvedValue(activeMembers as any);

      const notesRepoMock = {
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([{ polling_order_member_id: 1 }])
        })
      };
      (service as any).pollingNotesService['repository'] = notesRepoMock;

      const result = await service.getMissingVotesReport(5, 1);

      expect(result[0].missing_in_all).toHaveLength(1);
      expect(result[0].missing_in_all[0].name).toBe('Missing Member');
    });
  });
});
