import { describe, it, expect } from 'vitest';
import { GET } from './route';

// Mock the Request/Response for testing
describe('GET /api/health', () => {
  it('should return healthy status with ok: true', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('ok', true);
    expect(data).toHaveProperty('status', 'healthy');
  });

  it('should return JSON content type', async () => {
    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('should return response with correct structure', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({
      ok: true,
      status: 'healthy'
    });
  });
});
