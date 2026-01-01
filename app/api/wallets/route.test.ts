import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './route';
import { getAllWallets, createWallet, getAllWalletsWithBalances } from '@/lib/db/repositories/wallets';

// Mock the database initialization
vi.mock('@/lib/db/init', () => ({
  ensureDatabase: vi.fn().mockResolvedValue(undefined),
}));

// Mock the repository functions
vi.mock('@/lib/db/repositories/wallets', () => ({
  getAllWallets: vi.fn(),
  createWallet: vi.fn(),
  getAllWalletsWithBalances: vi.fn(),
  getWalletById: vi.fn(),
  updateWallet: vi.fn(),
  deleteWallet: vi.fn(),
}));

// Mock NextRequest
const mockNextRequest = (url: string, method: string = 'GET', body?: any) => {
  const urlObj = new URL(url, 'http://localhost');
  const request = {
    nextUrl: urlObj,
    json: async () => body,
  } as any;

  return request;
};

describe('GET /api/wallets', () => {
  it('should return all wallets when no query params', async () => {
    const mockWallets = [
      { id: 1, name: 'Cash Wallet', created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, name: 'Bank Account', created_at: '2024-01-01', updated_at: '2024-01-01' },
    ];

    vi.mocked(getAllWallets).mockReturnValue(mockWallets);

    const response = await GET(mockNextRequest('/api/wallets'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockWallets);
    expect(getAllWallets).toHaveBeenCalledTimes(1);
    expect(getAllWalletsWithBalances).not.toHaveBeenCalled();
  });

  it('should return wallets with balances when includeBalances=true', async () => {
    const mockWalletsWithBalances = [
      { id: 1, name: 'Cash Wallet', balance: 500000, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, name: 'Bank Account', balance: 1500000, created_at: '2024-01-01', updated_at: '2024-01-01' },
    ];

    vi.mocked(getAllWalletsWithBalances).mockReturnValue(mockWalletsWithBalances);

    const response = await GET(mockNextRequest('/api/wallets?includeBalances=true'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockWalletsWithBalances);
    expect(getAllWalletsWithBalances).toHaveBeenCalledTimes(1);
    expect(getAllWallets).not.toHaveBeenCalled();
  });

  it('should handle empty wallet list', async () => {
    vi.mocked(getAllWallets).mockReturnValue([]);

    const response = await GET(mockNextRequest('/api/wallets'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(getAllWallets).mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await GET(mockNextRequest('/api/wallets'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'Failed to fetch wallets');
  });
});

describe('POST /api/wallets', () => {
  it('should create a wallet with valid data', async () => {
    const mockWallet = {
      id: 1,
      name: 'New Wallet',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    };

    vi.mocked(createWallet).mockReturnValue(mockWallet);

    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', { name: 'New Wallet' })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockWallet);
    expect(createWallet).toHaveBeenCalledWith({ name: 'New Wallet' });
  });

  it('should trim whitespace from wallet name', async () => {
    const mockWallet = {
      id: 1,
      name: 'Trimmed Wallet',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    };

    vi.mocked(createWallet).mockReturnValue(mockWallet);

    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', { name: '  Trimmed Wallet  ' })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(createWallet).toHaveBeenCalledWith({ name: 'Trimmed Wallet' });
  });

  it('should return 400 when name is missing', async () => {
    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', {})
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'Name is required and must be a string');
  });

  it('should return 400 when name is not a string', async () => {
    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', { name: 123 })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'Name is required and must be a string');
  });

  it('should return 400 when name is empty', async () => {
    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', { name: '' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'Name cannot be empty');
  });

  it('should return 400 when name is only whitespace', async () => {
    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', { name: '   ' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'Name cannot be empty');
  });

  it('should return 400 when name exceeds 100 characters', async () => {
    const longName = 'a'.repeat(101);
    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', { name: longName })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'Name cannot exceed 100 characters');
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(createWallet).mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await POST(
      mockNextRequest('/api/wallets', 'POST', { name: 'Test Wallet' })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'Failed to create wallet');
  });
});
