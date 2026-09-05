import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module so no network / env is needed.
const single = vi.fn();
const select = vi.fn();
const insert = vi.fn();
const order = vi.fn();
const from = vi.fn();

vi.mock('./client', () => ({
  getClient: () => ({ from }),
  isConfigured: () => true,
}));

import { createWorkspace, listWorkspaces, slugify } from './workspaces';

const row = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Cui Lab',
  slug: 'cui-lab',
  region: 'us-west',
  created_at: '2026-09-05T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  // createWorkspace chain: from().insert().select().single()
  single.mockResolvedValue({ data: row, error: null });
  select.mockReturnValue({ single, order });
  insert.mockReturnValue({ select });
  // listWorkspaces chain: from().select().order()
  order.mockResolvedValue({ data: [row], error: null });
  from.mockReturnValue({ insert, select });
});

describe('slugify', () => {
  it('lowercases and dashes', () => {
    expect(slugify('Cui Lab  2026')).toBe('cui-lab-2026');
  });
  it('keeps CJK characters', () => {
    expect(slugify('崔实验室')).toBe('崔实验室');
  });
});

describe('workspaces api', () => {
  it('create → returns domain object (not a db row)', async () => {
    const ws = await createWorkspace('Cui Lab');
    expect(from).toHaveBeenCalledWith('workspaces');
    expect(insert).toHaveBeenCalledWith({ name: 'Cui Lab', slug: 'cui-lab', region: 'us-west' });
    expect(ws).toEqual({
      id: row.id,
      name: 'Cui Lab',
      slug: 'cui-lab',
      region: 'us-west',
      createdAt: row.created_at,
    });
    expect(ws).not.toHaveProperty('created_at');
  });

  it('list → round-trips through toDomain', async () => {
    const list = await listWorkspaces();
    expect(list).toHaveLength(1);
    expect(list[0].createdAt).toBe(row.created_at);
  });

  it('surfaces supabase errors', async () => {
    single.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(createWorkspace('x')).rejects.toThrow('boom');
  });
});
