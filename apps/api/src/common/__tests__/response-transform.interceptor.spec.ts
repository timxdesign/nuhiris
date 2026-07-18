import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor;

  beforeEach(() => {
    interceptor = new ResponseTransformInterceptor();
  });

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'x-request-id': 'test-req-id' } }),
    }),
  } as unknown as ExecutionContext;

  it('wraps response data in success envelope', (done) => {
    const handler: CallHandler = {
      handle: () => of({ id: 1, name: 'test' }),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      const r = result as Record<string, unknown>;
      expect(r.success).toBe(true);
      expect(r.data).toEqual({ id: 1, name: 'test' });
      expect(r.meta).toHaveProperty('requestId', 'test-req-id');
      done();
    });
  });

  it('wraps null response', (done) => {
    const handler: CallHandler = {
      handle: () => of(null),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      const r = result as Record<string, unknown>;
      expect(r.success).toBe(true);
      expect(r.data).toBeNull();
      done();
    });
  });

  it('wraps array response', (done) => {
    const handler: CallHandler = {
      handle: () => of([1, 2, 3]),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      const r = result as Record<string, unknown>;
      expect(r.success).toBe(true);
      expect(r.data).toEqual([1, 2, 3]);
      done();
    });
  });
});
