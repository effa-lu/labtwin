import { getClient } from './client';
import type { Workspace } from './types';

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  region: string;
  created_at: string;
}

function toDomain(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    region: row.region === 'ap' ? 'ap' : 'us-west',
    createdAt: row.created_at,
  };
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await getClient()
    .from('workspaces')
    .select('id,name,slug,region,created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as WorkspaceRow[]).map(toDomain);
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const { data, error } = await getClient()
    .from('workspaces')
    .insert({ name, slug: slugify(name), region: 'us-west' })
    .select('id,name,slug,region,created_at')
    .single();
  if (error) throw error;
  return toDomain(data as WorkspaceRow);
}
