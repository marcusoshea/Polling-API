import { HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { GlobalExceptionFilter } from './http-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = jest.fn().mockReturnValue({ url: '/test/path', method: 'GET' });
const mockSwitchToHttp = jest.fn().mockReturnValue({
  getResponse: mockGetResponse,
  getRequest: mockGetRequest
});

const mockArgumentsHost: any = {
  switchToHttp: mockSwitchToHttp
};

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new GlobalExceptionFilter();
  });

  describe('HttpException handling', () => {
    it('should return structured error response for a 404 HttpException', () => {
      const exception = new HttpException('Resource not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(404);
      const response = mockJson.mock.calls[0][0];
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Resource not found');
      expect(response.path).toBe('/test/path');
      expect(response.timestamp).toBeDefined();
    });

    it('should return 401 status for UnauthorizedException', () => {
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(401);
      const response = mockJson.mock.calls[0][0];
      expect(response.statusCode).toBe(401);
    });

    it('should extract message array from ValidationPipe error object', () => {
      const validationResponse = {
        message: ['name must not be empty', 'email must be an email'],
        error: 'Bad Request'
      };
      const exception = new HttpException(validationResponse, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(400);
      const response = mockJson.mock.calls[0][0];
      expect(response.statusCode).toBe(400);
      expect(response.message).toEqual(['name must not be empty', 'email must be an email']);
      expect(response.error).toBe('Bad Request');
    });

    it('should extract error name from HttpException response object', () => {
      const exceptionResponse = { message: 'Conflict', error: 'Conflict' };
      const exception = new HttpException(exceptionResponse, HttpStatus.CONFLICT);

      filter.catch(exception, mockArgumentsHost);

      const response = mockJson.mock.calls[0][0];
      expect(response.error).toBe('Conflict');
    });
  });

  describe('Generic Error handling', () => {
    it('should return a sanitized 500 for a plain Error (no internal text leaked)', () => {
      const exception = new Error('connect ECONNREFUSED 10.0.0.5:5432 — password authentication failed');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      const response = mockJson.mock.calls[0][0];
      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('An unexpected error occurred. Please try again.');
      expect(JSON.stringify(response)).not.toContain('ECONNREFUSED');
      expect(JSON.stringify(response)).not.toContain('password');
    });

    it('should return 500 for an unknown thrown value', () => {
      filter.catch('unexpected string error', mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      const response = mockJson.mock.calls[0][0];
      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('Internal server error');
    });
  });

  describe('Database error handling', () => {
    function queryFailed(driverMessage: string, code: string, copyCodeOntoException = true): QueryFailedError {
      const driverError: any = new Error(driverMessage);
      driverError.code = code;
      const qfe = new QueryFailedError('INSERT INTO "PollingNotes" ...', [], driverError);
      (qfe as any).driverError = driverError;
      if (copyCodeOntoException) {
        (qfe as any).code = code;
      } else {
        delete (qfe as any).code;
      }
      return qfe;
    }

    it('should map a Postgres unique violation (23505) to a clean 409', () => {
      const exception = queryFailed('duplicate key value violates unique constraint "UQ_pollingnotes"', '23505');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const response = mockJson.mock.calls[0][0];
      expect(response.message).toBe('This record already exists. Please refresh and try again.');
      expect(response.error).toBe('Conflict');
      expect(JSON.stringify(response)).not.toContain('duplicate key');
      expect(JSON.stringify(response)).not.toContain('UQ_pollingnotes');
    });

    it('should fall back to driverError.code when the code is not copied onto the exception', () => {
      const exception = queryFailed('duplicate key', '23505', false);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('should treat non-unique QueryFailedErrors as sanitized 500s', () => {
      const exception = queryFailed('null value in column "vote" violates not-null constraint', '23502');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      const response = mockJson.mock.calls[0][0];
      expect(response.message).toBe('An unexpected error occurred. Please try again.');
      expect(JSON.stringify(response)).not.toContain('not-null');
    });
  });

  describe('Response structure', () => {
    it('should always include statusCode, timestamp, path, error, and message', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const response = mockJson.mock.calls[0][0];
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('path');
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('message');
    });

    it('should include the request path in the response', () => {
      mockGetRequest.mockReturnValueOnce({ url: '/member/login', method: 'POST' });
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      filter.catch(exception, mockArgumentsHost);

      const response = mockJson.mock.calls[0][0];
      expect(response.path).toBe('/member/login');
    });

    it('should include an ISO timestamp', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      const before = new Date().toISOString();

      filter.catch(exception, mockArgumentsHost);

      const after = new Date().toISOString();
      const response = mockJson.mock.calls[0][0];
      expect(response.timestamp >= before).toBe(true);
      expect(response.timestamp <= after).toBe(true);
    });
  });
});
