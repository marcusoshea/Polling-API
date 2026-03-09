import { HttpException, HttpStatus } from '@nestjs/common';
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
    it('should return 500 for a plain Error', () => {
      const exception = new Error('Something crashed');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      const response = mockJson.mock.calls[0][0];
      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('Something crashed');
    });

    it('should return 500 for an unknown thrown value', () => {
      filter.catch('unexpected string error', mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(500);
      const response = mockJson.mock.calls[0][0];
      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('Internal server error');
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
