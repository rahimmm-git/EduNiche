import { useEffect, useState, type ReactNode } from 'react';
import { useAuth, useClerk } from '@clerk/react';
import {
  BookOpen,
  ChevronRight,
  CircleUserRound,
  LibraryBig,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  SquareLibrary,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getGetMeQueryKey, useGetMe } from '@workspace/api-client-react';
import type { UserProfile } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" data-testid="link-brand">
      <span className={cn('grid h-10 w-10 place-items-center rounded-xl shadow-sm transition-transform group-hover:-rotate-3', inverse ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground')}>
        <BookOpen className="h-5 w-5" />
      </span>
      <span className={cn('font-display text-xl font-semibold tracking-tight', inverse ? 'text-sidebar-foreground' : 'text-foreground')}>
        Pathshala
      </span>
    </Link>
  );
}

export function LoadingScreen({ label = 'Opening your study desk' }: { label?: string }) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-6">
      <div className="w-full max-w-xs space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-primary/20" />
        <div className="h-3 animate-pulse rounded-full bg-muted" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message = 'We could not load this page.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-8 text-center" data-testid="status-error">
      <p className="font-display text-xl text-foreground">A page is missing from the stack.</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry && <Button className="mt-5" variant="outline" onClick={onRetry} data-testid="button-retry">Try again</Button>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center" data-testid="status-empty">
      <SquareLibrary className="mx-auto h-8 w-8 text-primary/70" />
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight text-foreground md:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function ProtectedPage({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isLoaded && !isSignedIn) setLocation('/sign-in');
  }, [isLoaded, isSignedIn, setLocation]);
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) {
    return <LoadingScreen label="Taking you to sign in" />;
  }
  return <>{children}</>;
}

function RoleBadge({ profile }: { profile?: UserProfile }) {
  const role = profile?.role ?? 'student';
  return <span className="rounded-full bg-accent/25 px-2.5 py-1 text-[11px] font-semibold capitalize text-accent-foreground">{role}</span>;
}

export function AppShell({ children, active }: { children: React.ReactNode; active: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useClerk();
  const [location] = useLocation();
  const { data: profile } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const role = profile?.role ?? 'student';
  const nav = [
    { href: role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/student', label: 'Desk', icon: LibraryBig },
    { href: '/curriculum', label: 'Curriculum', icon: BookOpen },
    ...(role === 'admin' ? [{ href: '/admin', label: 'Manage', icon: ShieldCheck }] : []),
    { href: '/settings', label: 'Profile context', icon: Settings2 },
  ];
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between">
          <Brand inverse />
          <button className="rounded-lg p-2 text-sidebar-foreground/70 lg:hidden" onClick={close} aria-label="Close navigation" data-testid="button-close-navigation"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-8 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/60">Your context</p>
          <p className="mt-2 truncate font-medium">{profile?.school?.name ?? 'School profile'}</p>
          <p className="mt-1 text-xs text-sidebar-foreground/65">{profile?.board?.name ?? 'Choose your board'} {profile?.class?.name ? `· ${profile.class.name}` : ''}</p>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={close} className={cn('group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors', active === label.toLowerCase() || location === href ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-70" />
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <Link href="/settings" className="flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent" data-testid="link-profile">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">{(profile?.name ?? 'P').slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{profile?.name ?? 'Your profile'}</span><span className="block truncate text-xs text-sidebar-foreground/60"><RoleBadge profile={profile} /></span></span>
            <CircleUserRound className="h-4 w-4 text-sidebar-foreground/50" />
          </Link>
          <button className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={() => signOut({ redirectUrl: '/' })} data-testid="button-sign-out"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-sidebar/40 backdrop-blur-sm lg:hidden" onClick={close} aria-label="Close menu overlay" data-testid="button-close-overlay" />}
      <main className="min-h-[100dvh] lg:pl-[264px]">
        <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12 lg:py-10">
          <button className="mb-6 rounded-xl border border-border bg-card p-2 text-muted-foreground lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu className="h-5 w-5" /></button>
          {children}
        </div>
      </main>
    </div>
  );
}