import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor;

  beforeEach(() => {
    interceptor = new ResponseTransformInterceptor();
  });

  const context = {} as ExecutionContext;

  it('wraps response data in success envelope', (done) => {
    const handler: CallHandler = {
      handle: () => of({ id: 1, name: 'test' }),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'test' },
      });
      done();
    });
  });

  it('wraps null response', (done) => {
    const handler: CallHandler = {
      handle: () => of(null),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
      });
      done();
    });
  });

  it('wraps array response', (done) => {
    const handler: CallHandler = {
      handle: () => of([1, 2, 3]),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: [1, 2, 3],
      });
      done();
    });
  });
});
