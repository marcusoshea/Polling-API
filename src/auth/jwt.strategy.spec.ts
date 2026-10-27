// constants.ts loads the env file and throws without JWT_SECRET; mock it so the
// spec does not depend on a local env file (jest.mock is hoisted above imports).
jest.mock('./constants', () => ({ jwtConstants: { secret: 'test-secret' } }));
// passwordFingerprint reads the secret at call time.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';
import { passwordFingerprint } from './password-fingerprint';

describe('JwtStrategy', () => {
  const currentHash = '$2b$10$currentcurrentcurrentcurrentcu';
  const findOne = jest.fn();
  let strategy: JwtStrategy;

  beforeEach(async () => {
    findOne.mockReset();
    // Built through Nest's injector, so this also proves the DataSource property
    // injection resolves (the strategy is registered in modules without a Member repo).
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: DataSource, useValue: { getRepository: () => ({ findOne }) } }
      ]
    }).compile();
    strategy = module.get(JwtStrategy);
  });

  it('should accept a token whose fingerprint matches the current password', async () => {
    findOne.mockResolvedValue({ polling_order_member_id: 42, password: currentHash });

    await expect(strategy.validate({ polling_order_member_id: 42, pwv: passwordFingerprint(currentHash) }))
      .resolves.toBeDefined();
    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { polling_order_member_id: 42 }
    }));
  });

  it('should reject a token issued before a password change', async () => {
    findOne.mockResolvedValue({ polling_order_member_id: 42, password: '$2b$10$newnewnewnewnewnewnewnewnewnewn' });

    await expect(strategy.validate({ polling_order_member_id: 42, pwv: passwordFingerprint(currentHash) }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token with no fingerprint (issued before this check existed)', async () => {
    findOne.mockResolvedValue({ polling_order_member_id: 42, password: currentHash });

    await expect(strategy.validate({ polling_order_member_id: 42 }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should reject a token for a member that no longer exists', async () => {
    findOne.mockResolvedValue(null);

    await expect(strategy.validate({ polling_order_member_id: 42, pwv: passwordFingerprint(currentHash) }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should reject a payload with no member id without querying', async () => {
    // An undefined id would be dropped from the where clause and match anyone.
    await expect(strategy.validate({ pwv: passwordFingerprint(currentHash) }))
      .rejects.toThrow(UnauthorizedException);
    expect(findOne).not.toHaveBeenCalled();
  });
});
