import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }
    private readonly logger = new Logger(AuthService.name)

    public validate(authToken: any) {
        return this.jwtService.decode(authToken);
    }

    public isOrderAdmin(authToken: any): boolean {
        const requestingMember = JSON.parse(JSON.stringify(this.jwtService.decode(authToken)));
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
    }

    public isRecordOwner(authToken: any, recordOwner: number): boolean {
        const requestingMember = JSON.parse(JSON.stringify(this.jwtService.decode(authToken)));
        const mappedReqMember = new Map(Object.entries(requestingMember));
        const memberReqId = mappedReqMember.get("polling_order_member_id");
        if (recordOwner === memberReqId) {
            return true;
        }
        return false;
    }

}
