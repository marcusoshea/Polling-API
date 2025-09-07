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

    
    public getPollingOrderMemberId(authToken: any): number {
        const requestingMember = JSON.parse(JSON.stringify(this.jwtService.decode(authToken)));
        const mappedReqMember = new Map(Object.entries(requestingMember));
        const memberReqId = mappedReqMember.get("polling_order_member_id");
        return Number(memberReqId);
    }

    public getPollingOrderId(authToken: any): number {
        try {
            console.log('AuthService.getPollingOrderId called with token:', authToken);
            
            if (!authToken) {
                console.error('Auth token is null or undefined');
                throw new Error('Authentication token is required');
            }
            
            const requestingMember = JSON.parse(JSON.stringify(this.jwtService.decode(authToken)));
            console.log('Decoded JWT token:', requestingMember);
            
            if (!requestingMember) {
                console.error('Failed to decode JWT token');
                throw new Error('Invalid authentication token');
            }
            
            const mappedReqMember = new Map(Object.entries(requestingMember));
            
            // Try to get polling_order_id directly first
            let pollingOrderId = mappedReqMember.get("polling_order_id");
            
            // If not found, try to get it from pollingOrderInfo (like in isOrderAdmin)
            if (!pollingOrderId) {
                const pollingOrderInfo = mappedReqMember.get("pollingOrderInfo");
                if (pollingOrderInfo) {
                    const mappedPollingOrder = new Map(Object.entries(pollingOrderInfo));
                    pollingOrderId = mappedPollingOrder.get("polling_order_id");
                }
            }
            
            console.log('Extracted polling_order_id:', pollingOrderId);
            
            if (!pollingOrderId) {
                console.error('Could not find polling_order_id in JWT token');
                throw new Error('Polling order ID not found in authentication token');
            }
            
            return Number(pollingOrderId);
        } catch (error) {
            console.error('Error in getPollingOrderId:', error);
            throw error;
        }
    }

    public isMemberOfPollingOrder(authToken: any, pollingOrderId: number): boolean {
        const requestingMember = JSON.parse(JSON.stringify(this.jwtService.decode(authToken)));
        const mappedReqMember = new Map(Object.entries(requestingMember));
        const memberPollingOrderId = mappedReqMember.get("polling_order_id");
        return Number(memberPollingOrderId) === pollingOrderId;
    }

}
