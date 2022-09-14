import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor() { }
    private readonly logger = new Logger(AuthService.name)
}
