import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { DataSource } from "typeorm";
import { jwtConstants } from './constants';
import { Member } from '../member/member.entity';
import { fingerprintMatches } from './password-fingerprint';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    // DataSource rather than a Member repository: this strategy is registered in
    // several feature modules, and not all of them register the Member entity.
    @Inject(DataSource)
    private readonly dataSource!: DataSource;

    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret
        })
    }

    async validate(payload: any) {
        // A valid signature only proves the token was issued, not that it is still
        // wanted. Reject it once the member's password has changed since issue, so a
        // reset or change-password actually ends other sessions. Tokens from before
        // `pwv` existed carry no fingerprint and are rejected too.
        const memberId = Number(payload?.polling_order_member_id);
        if (!Number.isInteger(memberId) || memberId <= 0) {
            throw new UnauthorizedException();
        }
        const member = await this.dataSource.getRepository(Member).findOne({
            where: { polling_order_member_id: memberId },
            select: { polling_order_member_id: true, password: true }
        });
        if (!member || !fingerprintMatches(member.password, payload.pwv)) {
            throw new UnauthorizedException();
        }
        return {userId: payload.sub, username: payload.username}
    }
}
