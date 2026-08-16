import { logger } from './logger';

describe('logger', () => {
  it('writes structured messages to the matching console method', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    logger.error('failed', { requestId: 'request-1' });
    logger.info('done', { count: 1 });
    logger.warn('slow');

    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      level: 'ERROR',
      message: 'failed',
      requestId: 'request-1',
    });
    expect(JSON.parse(String(info.mock.calls[0]?.[0]))).toMatchObject({
      count: 1,
      level: 'INFO',
      message: 'done',
    });
    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toMatchObject({
      level: 'WARN',
      message: 'slow',
    });
  });
});
