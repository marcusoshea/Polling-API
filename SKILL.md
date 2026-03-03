# Polling API — Agent Reference

## Project Facts

### Infrastructure
- **Runtime**: NestJS 11 + TypeScript on Express
- **Database**: PostgreSQL on **AWS RDS**, accessed via TypeORM 0.3
- **SSL**: Required for all DB connections — CA bundle at `certs/rds-combined-ca-bundle.pem`
- **Schema management**: `synchronize: false`; schema lives outside the codebase (no migration files present in src)
- **API docs**: Swagger UI served at `/api` (configured in `src/main.ts`)
- **CORS**: Enabled globally (`app.enableCors()`)
- **Auth**: JWT Bearer tokens via `@nestjs/jwt` + `passport-jwt`; passwords hashed with bcrypt
- **Email**: `nodemailer` used for registration notifications, approval emails, and password reset

### Module List
All feature modules live under `src/` as self-contained folders (controller / service / entity / dto / module):

| Module | Route prefix | Purpose |
|---|---|---|
| `member` | `/member` | Login, registration, password reset, member CRUD |
| `polling` | `/polling` | Poll lifecycle, reporting, vote summaries |
| `polling_notes` | `/polling-notes` | Per-member votes and notes per candidate per poll |
| `polling_order` | `/polling-order` | The organization that owns polls |
| `candidate` | `/candidate` | Candidate management; `candidate_images` entity lives here too |
| `external_notes` | `/external-notes` | Notes sourced from outside the system |
| `feedback` | `/feedback` | Member feedback submissions |
| `order_policies` | `/order-policies` | Rules and policies per polling order *(newer)* |
| `survey` | `/survey` | Yes / No / Abstain time-boxed surveys *(newest)* |
| `auth` | — | `JwtAuthGuard` + `JwtStrategy`; shared across all modules |
| `shared/typeorm` | — | `TypeOrmConfigService`; DB connection factory |
| `common/helper` | — | `getEnvPath()`: selects env file by `NODE_ENV` |

### JWT Token Payload
The signed token contains:
- `polling_order_member_id` — the authenticated member's ID
- `polling_order_id` — the polling order they belong to
- `pollingOrderInfo` — nested object with `polling_order_admin` and `polling_order_admin_assistant` IDs

`AuthService` (`src/auth/auth.service.ts`) provides helpers to inspect a token without re-querying the DB:
`isOrderAdmin()`, `isRecordOwner()`, `getPollingOrderMemberId()`, `getPollingOrderId()`, `isMemberOfPollingOrder()`

### Vote Encoding
Stored as integers in `polling_notes.vote`:

| Value | Meaning |
|---|---|
| `1` | Yes |
| `2` | Wait |
| `3` | No |
| `4` | Abstain |

### Member Status Flags
Three independent booleans on the `Member` entity (`PollingOrderMember` table):

| Flag | Meaning |
|---|---|
| `approved` | Set to `true` by an order admin after registration |
| `removed` | Soft-delete flag; member is excluded from active membership |
| `active` | Member's own active/inactive toggle |

A member can log in only if `approved === true && removed === false`.

---

## Evolution Patterns

These inconsistencies exist because the codebase evolved over time. **Do not clean them up** unless explicitly asked. When writing new code, always follow the **Preferred (new)** style. Older modules keep their original style.

---

### 1. Dependency Injection — Controllers

**Older modules** (`member`, `polling`, `polling_notes`, `candidate`, `polling_order`, `external_notes`, `feedback`):
```ts
// Empty constructor; service injected as a class property
@Injectable()
@Controller('polling')
export class PollingController {
  constructor() {}

  @Inject(PollingService)
  private readonly service: PollingService;
}
```

**Preferred (new)** — `order_policies`, `survey`:
```ts
// Service injected via constructor parameter
@Controller('order-policies')
@UseGuards(JwtAuthGuard)
export class OrderPoliciesController {
  constructor(private readonly orderPoliciesService: OrderPoliciesService) {}
}
```

---

### 2. Dependency Injection — Repositories in Services

**Older modules** — stacked `@InjectRepository` decorators above a single typed property (only the first decorator is actually used by NestJS; the rest are no-ops):
```ts
@InjectRepository(PollingNotes)
@InjectRepository(PollingOrder)   // ← effectively ignored
@InjectRepository(Member)         // ← effectively ignored
private readonly repository: Repository<PollingNotes>;
```

**Preferred (new)** — one named constructor parameter per repository:
```ts
constructor(
  @InjectRepository(Survey)
  private surveyRepository: Repository<Survey>,
  @InjectRepository(SurveyResponse)
  private surveyResponseRepository: Repository<SurveyResponse>,
  @InjectRepository(PollingOrderMember)
  private memberRepository: Repository<PollingOrderMember>,
) {}
```

---

### 3. Authorization Token Handling

**Older modules** — `authToken` is a field on the DTO and travels in the request body. The service decodes it directly:
```ts
// DTO carries the token
export class DeletePollingNoteDto {
  authToken: string;
  polling_notes_id: number;
}

// Controller passes body straight through
@Delete('/delete')
public deletePollingNote(@Body() body: DeletePollingNoteDto): Promise<boolean> {
  return this.service.deletePollingNote(body);
}

// Service decodes the token from the body field
public async deletePollingNote(body: DeletePollingNoteDto): Promise<boolean> {
  if (!this.authService.isOrderAdmin(body.authToken)) {
    throw new UnauthorizedException();
  }
  ...
}
```

**Preferred (new)** — token extracted from the `Authorization` header in the controller; never put in the request body:
```ts
// Controller strips Bearer prefix and passes token separately
@Get('polling-order/:pollingOrderId')
async getOrderPolicy(
  @Param('pollingOrderId', ParseIntPipe) pollingOrderId: number,
  @Req() request: Request
): Promise<OrderPolicyResponseDto | null> {
  const authHeader = request.headers.authorization;
  const authToken = authHeader ? authHeader.replace('Bearer ', '') : '';
  return await this.orderPoliciesService.getOrderPolicy({ polling_order_id: pollingOrderId, authToken });
}
```

---

### 4. Exception Types

**Older modules** — generic `HttpException` + `HttpStatus` constants, or bare `UnauthorizedException`:
```ts
throw new HttpException('Account exists already.', HttpStatus.NOT_ACCEPTABLE);
throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
throw new UnauthorizedException();
```

**Preferred (new)** — semantic NestJS exception classes with descriptive human-readable messages:
```ts
throw new NotFoundException(`Survey with ID ${surveyId} not found`);
throw new BadRequestException('End date must be after start date');
throw new ForbiddenException('Only polling order administrators can create surveys');
```

---

### 5. Guard Placement

**Older modules** — `@UseGuards(JwtAuthGuard)` applied per-route; intentionally unguarded routes are simply left undecorated:
```ts
@UseGuards(JwtAuthGuard)
@Get('/all/:id')
public getAllMembers(...) { ... }

@Post('/create')        // intentionally unguarded — public registration
public createMember(...) { ... }
```

**Preferred (new)** — `@UseGuards(JwtAuthGuard)` on the controller class; every route is protected by default:
```ts
@Controller('order-policies')
@UseGuards(JwtAuthGuard)
export class OrderPoliciesController { ... }
```

---

### 6. Logging

**Older modules** — `Logger` declared but `console.log` / `console.error` also present, especially in `auth.service.ts` (debugging leftover):
```ts
private readonly logger = new Logger(MemberService.name);
this.logger.warn('MAIL_PORT', process.env.MAIL_PORT);

// debugging left in auth.service.ts:
console.log('AuthService.getPollingOrderId called with token:', authToken);
console.error('Error in getPollingOrderId:', error);
```

**Preferred (new)** — NestJS `Logger` only; no `console.*` in committed code.

---

## Quick Reference

| Concern | Older style (leave as-is) | Preferred for new code |
|---|---|---|
| Controller DI | `@Inject()` property injection | Constructor injection |
| Repository DI | Stacked `@InjectRepository` on one property | Named constructor param per repository |
| Auth token source | `authToken` field in request body / DTO | Extracted from `Authorization` header in controller |
| Exceptions | `HttpException` + `HttpStatus.*` | `NotFoundException`, `BadRequestException`, `ForbiddenException` |
| Guard scope | Per-route `@UseGuards` | Controller-level `@UseGuards` |
| Logging | Mixed `Logger` + `console.*` | NestJS `Logger` only |
