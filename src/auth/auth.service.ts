import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }
    private readonly logger = new Logger(AuthService.name)

    public validate(authToken: any) {
        return this.jwtService.verify(authToken);
    }

    public isOrderAdmin(authToken: any): boolean {
        try {
            const requestingMember = JSON.parse(JSON.stringify(this.jwtService.verify(authToken)));
            if (requestingMember) {
                const mappedReqMember = new Map(Object.entries(requestingMember));
                const memberReqId = mappedReqMember.get("polling_order_member_id")
                const mappedPollingOrder = new Map(Object.entries(mappedReqMember.get("pollingOrderInfo")));
                const PollingAdminId = mappedPollingOrder.get("polling_order_admin")
                const PollingAdminAsstId = mappedPollingOrder.get("polling_order_admin_assistant")
                if (memberReqId === PollingAdminId || memberReqId === PollingAdminAsstId) {
                    return true;
                }
            }
            return false;
        } catch {
            throw new UnauthorizedException();
        }
    }

    public isRecordOwner(authToken: any, recordOwner: number): boolean {
        try {
            const requestingMember = JSON.parse(JSON.stringify(this.jwtService.verify(authToken)));
            const mappedReqMember = new Map(Object.entries(requestingMember));
            const memberReqId = mappedReqMember.get("polling_order_member_id");
            return recordOwner === memberReqId;
        } catch {
            throw new UnauthorizedException();
        }
    }

    public getPollingOrderMemberId(authToken: any): number {
        try {
            const requestingMember = JSON.parse(JSON.stringify(this.jwtService.verify(authToken)));
            const mappedReqMember = new Map(Object.entries(requestingMember));
            const memberReqId = mappedReqMember.get("polling_order_member_id");
            return Number(memberReqId);
        } catch {
            throw new UnauthorizedException();
        }
    }

    public getPollingOrderId(authToken: any): number {
        if (!authToken) {
            throw new UnauthorizedException('Authentication token is required');
        }

        let requestingMember: unknown;
        try {
            // verify() (not decode()) so the token signature is validated — this token
            // arrives in the request body, separate from the header token the guard checks.
            requestingMember = this.jwtService.verify(authToken);
        } catch {
            throw new UnauthorizedException('Invalid authentication token');
        }

        if (!requestingMember) {
            throw new UnauthorizedException('Invalid authentication token');
        }

        const mappedReqMember = new Map(Object.entries(requestingMember));

        let pollingOrderId = mappedReqMember.get("polling_order_id");

        if (!pollingOrderId) {
            const pollingOrderInfo = mappedReqMember.get("pollingOrderInfo");
            if (pollingOrderInfo) {
                const mappedPollingOrder = new Map(Object.entries(pollingOrderInfo));
                pollingOrderId = mappedPollingOrder.get("polling_order_id");
            }
        }

        if (!pollingOrderId) {
            throw new UnauthorizedException('Polling order ID not found in authentication token');
        }

        return Number(pollingOrderId);
    }

    public isMemberOfPollingOrder(authToken: any, pollingOrderId: number): boolean {
        try {
            const requestingMember = JSON.parse(JSON.stringify(this.jwtService.verify(authToken)));
            const mappedReqMember = new Map(Object.entries(requestingMember));
            const memberPollingOrderId = mappedReqMember.get("polling_order_id");
            return Number(memberPollingOrderId) === pollingOrderId;
        } catch {
            throw new UnauthorizedException();
        }
    }

}
