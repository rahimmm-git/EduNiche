import { useMemo, useState } from 'react';
import { Database, Edit3, Plus, RefreshCw, ShieldCheck, Trash2, UsersRound, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListAdminEntitiesQueryKey,
  getListUsersQueryKey,
  useCreateAdminEntity,
  useDeleteAdminEntity,
  useListAdminEntities,
  useListUsers,
  useUpdateAdminEntity,
} from '@workspace/api-client-react';
import type { EntityQueryParameter, AdminEntity } from '@workspace/api-client-react';
import { AppShell, EmptyState, ErrorState, LoadingScreen, PageHeader, ProtectedPage } from '@/components/app-shell';
import { Button } from '@/components/ui/button';

const entityTabs: { value: EntityQueryParameter; label: string; help: string }[] = [
  { value: 'cities', label: 'Cities', help: 'Top-level locations' },
  { value: 'boards', label: 'Boards', help: 'Curriculum boards' },
  { value: 'schools', label: 'Schools', help: 'Schools in a city and board' },
  { value: 'classes', label: 'Classes', help: 'Classes in a school' },
  { value: 'subjects', label: 'Subjects', help: 'Subjects in a class' },
  { value: 'books', label: 'Books', help: 'Books in a subject' },
  { value: 'chapters', label: 'Chapters', help: 'Chapters in a book' },
  { value: 'topics', label: 'Topics', help: 'Topics in a chapter' },
];

export default function AdminPage() {
  return <ProtectedPage><AdminContent /></ProtectedPage>;
}

function AdminContent() {
  const queryClient = useQueryClient();
  const [entity, setEntity] = useState<EntityQueryParameter>('schools');
  const [editing, setEditing] = useState<AdminEntity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const params = useMemo(() => ({ entity }), [entity]);
  const entities = useListAdminEntities(params, { query: { queryKey: getListAdminEntitiesQueryKey(params) } });
  const users = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const create = useCreateAdminEntity();
  const update = useUpdateAdminEntity();
  const remove = useDeleteAdminEntity();
  if (entities.isLoading || users.isLoading) return <LoadingScreen label="Loading curriculum management" />;
  if (entities.isError || users.isError) return <AppShell active="manage"><ErrorState message="The management desk could not load." onRetry={() => { entities.refetch(); users.refetch(); }} /></AppShell>;
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListAdminEntitiesQueryKey(params) });
  return <AppShell active="manage"><PageHeader eyebrow="Admin desk" title="Keep the curriculum in order." description="Manage the entities that shape every student's school-specific learning path." action={<Button onClick={() => { setEditing(null); setShowForm(true); }} data-testid="button-add-entity"><Plus className="h-4 w-4" /> Add {entityTabs.find((tab) => tab.value === entity)?.label.slice(0, -1)}</Button>} /><div className="grid gap-6 xl:grid-cols-[220px_1fr]"><aside className="rounded-2xl border border-border bg-card p-3"><p className="px-3 py-2 text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Curriculum entities</p><div className="mt-2 space-y-1">{entityTabs.map((tab) => <button key={tab.value} onClick={() => { setEntity(tab.value); setShowForm(false); }} className={`w-full rounded-xl px-3 py-3 text-left ${entity === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} data-testid={`button-entity-${tab.value}`}><span className="block text-sm font-semibold">{tab.label}</span><span className={`mt-0.5 block text-xs ${entity === tab.value ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{tab.help}</span></button>)}</div></aside><section><div className="grid gap-4 sm:grid-cols-3"><Metric label="Users" value={users.data?.length ?? 0} icon={UsersRound} /><Metric label="Selected records" value={entities.data?.length ?? 0} icon={Database} /><Metric label="System status" value="Ready" icon={ShieldCheck} /></div><div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-display text-2xl">{entityTabs.find((tab) => tab.value === entity)?.label}</h2><p className="mt-1 text-sm text-muted-foreground">Records used by onboarding and curriculum views.</p></div><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" onClick={refresh} aria-label="Refresh records" data-testid="button-refresh-entities"><RefreshCw className="h-4 w-4" /></button></div>{!entities.data?.length ? <div className="p-5"><EmptyState title={`No ${entity} yet.`} description="Add the first record to make it available to your school community." /></div> : <div className="divide-y divide-border">{entities.data.map((item) => <div className="flex items-center gap-4 p-4" key={item.id} data-testid={`row-entity-${item.id}`}><span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-secondary-foreground text-xs font-bold">{String(item.id).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{item.name}</span><span className="mt-1 block text-xs text-muted-foreground">{item.parentId ? `Parent record #${item.parentId}` : 'Top-level record'}</span></span><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => { setEditing(item); setShowForm(true); }} aria-label={`Edit ${item.name}`} data-testid={`button-edit-entity-${item.id}`}><Edit3 className="h-4 w-4" /></button><button className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => { if (window.confirm(`Delete ${item.name}?`)) remove.mutate({ params: { entity, id: item.id } }, { onSuccess: refresh }); }} aria-label={`Delete ${item.name}`} data-testid={`button-delete-entity-${item.id}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}</div></section></div>{showForm && <EntityForm entity={entity} existing={editing} pending={create.isPending || update.isPending} onClose={() => setShowForm(false)} onSave={(data) => { if (editing) update.mutate({ data, params: { entity, id: editing.id } }, { onSuccess: () => { setShowForm(false); refresh(); } }); else create.mutate({ data, params: { entity } }, { onSuccess: () => { setShowForm(false); refresh(); } }); }} />}</AppShell>;
}

function EntityForm({ entity, existing, pending, onClose, onSave }: { entity: EntityQueryParameter; existing: AdminEntity | null; pending: boolean; onClose: () => void; onSave: (data: { name: string; parentId?: number | null; metadata?: Record<string, unknown> }) => void }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [parentId, setParentId] = useState(existing?.parentId ? String(existing.parentId) : '');
  const [metadata, setMetadata] = useState(existing ? JSON.stringify(existing.metadata, null, 2) : '{}');
  const submit = (event: React.FormEvent) => { event.preventDefault(); let parsed: Record<string, unknown> = {}; try { parsed = JSON.parse(metadata) as Record<string, unknown>; } catch { parsed = {}; } onSave({ name: name.trim(), parentId: parentId ? Number(parentId) : null, metadata: parsed }); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-sidebar/40 p-5 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 paper-shadow sm:p-8" data-testid="form-entity"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{existing ? 'Edit record' : 'New record'}</p><h2 className="mt-2 font-display text-3xl">{entity.slice(0, 1).toUpperCase() + entity.slice(1, -1)}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close form" data-testid="button-close-entity-form"><X className="h-5 w-5" /></button></div><label className="mt-7 block text-sm font-semibold">Name<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary" data-testid="input-entity-name" /></label><label className="mt-5 block text-sm font-semibold">Parent ID <span className="font-normal text-muted-foreground">(optional)</span><input value={parentId} onChange={(event) => setParentId(event.target.value)} type="number" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary" data-testid="input-entity-parent" /></label><label className="mt-5 block text-sm font-semibold">Metadata JSON<textarea value={metadata} onChange={(event) => setMetadata(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background p-3 font-mono text-xs outline-none focus:border-primary" data-testid="input-entity-metadata" /></label><div className="mt-7 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-entity">Cancel</Button><Button type="submit" disabled={pending || !name.trim()} data-testid="button-save-entity">{pending ? 'Saving…' : existing ? 'Save changes' : 'Create record'}</Button></div></form></div>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Database }) {
  return <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4 text-primary" /></div><p className="mt-3 font-display text-3xl">{value}</p></div>;
}