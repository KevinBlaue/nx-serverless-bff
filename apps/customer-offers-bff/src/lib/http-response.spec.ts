import { jsonResponse } from './http-response';

describe('jsonResponse', () => {
  it('returns JSON with caching disabled', () => {
    expect(jsonResponse(200, { ok: true })).toEqual({
      body: '{"ok":true}',
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
      },
      statusCode: 200,
    });
  });
});
