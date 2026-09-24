import { useEffect, useState } from 'react';
import { Check, LogOut, Save, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useClerk } from '@clerk/react';
import { getGetMeQueryKey, useGetMe, useGetOnboardingOptions, useUpdateMe } from '@workspace/api-client-react';
import { AppShell, ErrorState, LoadingScreen, PageHeader, ProtectedPage } from '@/components/app-shell';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return <ProtectedPage><SettingsContent /></ProtectedPage>;
}

function SettingsContent() {
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const profile = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const options = useGetOnboardingOptions(undefined, { query: { queryKey: ['/api/onboarding/options'] } });
  const update = useUpdateMe();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (profile.data?.name) setName(profile.data.name); }, [profile.data?.name]);
  if (profile.isLoading) return <LoadingScreen />;
  if (profile.isError || !profile.data) return <AppShell active="profile context"><ErrorState message="We could not load your profile context." onRetry={() => profile.refetch()} /></AppShell>;
  const current = profile.data;
  const classLabel = current.class?.name ?? (current.teacherAssignments.map((assignment) => assignment.className).join(', ') || 'Not set');
  const save = () => {
    if (!current.city?.id || !current.board?.id || !current.school?.id) return;
    update.mutate({ data: { name: name.trim(), role: current.role === 'admin' ? 'student' : current.role, cityId: current.city.id, boardId: current.board.id, schoolId: current.school.id, classId: current.class?.id ?? null, teacherAssignments: current.teacherAssignments.map((assignment) => ({ classId: assignment.classId, subjectId: assignment.subjectId })) } }, { onSuccess: (next) => { queryClient.setQueryData(getGetMeQueryKey(), next); setSaved(true); window.setTimeout(() => setSaved(false), 2200); } });
  };
  return <AppShell active="profile context"><PageHeader eyebrow="Profile context" title="The details behind your desk." description="Your school, board and class keep every curriculum view precise." /><div className="grid gap-6 lg:grid-cols-[1fr_.65fr]"><section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-4 border-b border-border pb-6"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">{current.name.slice(0, 1).toUpperCase()}</span><div><h2 className="font-display text-2xl">{current.name}</h2><p className="mt-1 text-sm text-muted-foreground">{current.email}</p></div></div><label className="mt-7 block text-sm font-semibold">Display name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-profile-name" /></label><div className="mt-7 grid gap-4 sm:grid-cols-2"><Context label="Role" value={current.role} /><Context label="City" value={current.city?.name ?? 'Not set'} /><Context label="Board" value={current.board?.name ?? 'Not set'} /><Context label="School" value={current.school?.name ?? 'Not set'} /><Context label="Class" value={classLabel} /></div><div className="mt-8 flex flex-wrap items-center gap-3"><Button onClick={save} disabled={update.isPending || !name.trim()} data-testid="button-save-profile"><Save className="h-4 w-4" /> {update.isPending ? 'Saving…' : 'Save profile'}</Button>{saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-foreground" data-testid="status-profile-saved"><Check className="h-4 w-4" /> Saved</span>}</div>{update.isError && <p className="mt-4 text-sm text-destructive" data-testid="status-profile-error">We could not save these details. Please try again.</p>}</section><aside className="space-y-4"><div className="rounded-2xl border border-border bg-secondary p-6 text-secondary-foreground"><UserRound className="h-5 w-5" /><h2 className="mt-8 font-display text-2xl">A useful context, not a profile to maintain.</h2><p className="mt-3 text-sm leading-6 text-secondary-foreground/75">Pathshala uses these details to keep your curriculum shelf relevant. The available school options are managed by your administrator.</p><p className="mt-5 text-xs font-semibold uppercase tracking-[.14em] text-secondary-foreground/60">{options.data?.schools.length ?? 0} schools in the current directory</p></div><button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left text-sm font-semibold text-destructive hover:bg-destructive/5" onClick={() => signOut({ redirectUrl: '/' })} data-testid="button-settings-sign-out"><LogOut className="h-4 w-4" /> Sign out of Pathshala</button></aside></div></AppShell>;
}

function Context({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold capitalize" data-testid={`text-context-${label.toLowerCase()}`}>{value}</p></div>;
}