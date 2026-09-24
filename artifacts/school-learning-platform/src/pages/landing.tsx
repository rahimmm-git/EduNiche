import { ArrowRight, BookOpen, Check, GraduationCap, MapPin, Sparkles, UsersRound } from 'lucide-react';
import { Link } from 'wouter';
import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';
import { Brand } from '@/components/app-shell';

export default function Landing() {
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-background">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12" data-testid="nav-public">
        <Brand />
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how-it-works" data-testid="link-how-it-works">How it works</a>
          <a href="#for-schools" data-testid="link-for-schools">For schools</a>
          <Link href="/sign-in" className="font-semibold text-foreground" data-testid="link-sign-in">Sign in</Link>
          <Link href="/sign-up" className="rounded-full bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-get-started">Get started</Link>
        </div>
        <Link href="/sign-in" className="rounded-full border border-border px-4 py-2 text-sm font-semibold md:hidden" data-testid="link-mobile-sign-in">Sign in</Link>
      </nav>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-28 lg:pt-24">
          <div className="reveal">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> Made for the school day</div>
            <h1 className="max-w-3xl font-display text-[3.5rem] font-semibold leading-[.98] tracking-[-0.045em] text-foreground sm:text-7xl lg:text-[5.5rem]">The right page,<br /><span className="text-primary">for the right class.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Pathshala brings your school, board, books and chapters into one quiet study companion. No wandering through a generic portal. Just open the lesson in front of you.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5" data-testid="link-hero-start">Set up your study desk <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/curriculum" className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground" data-testid="link-hero-curriculum">Browse a curriculum</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> School-specific</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Board-aware</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Built for focus</span>
            </div>
          </div>
          <div className="relative reveal reveal-delay-2" aria-label="Pathshala study desk preview" data-testid="art-study-desk">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
            <div className="relative rotate-[2deg] rounded-[2rem] border border-border bg-card p-4 paper-shadow sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-primary" /> My study desk</div><span className="text-xs text-muted-foreground">Tuesday, 11 June</span></div>
              <div className="grid gap-4 py-5 sm:grid-cols-[1.1fr_.9fr]">
                <div className="rounded-2xl bg-secondary p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-secondary-foreground/65">Continue learning</p><p className="mt-8 font-display text-3xl leading-tight text-secondary-foreground">Light<br />and shadows</p><p className="mt-4 text-xs leading-5 text-secondary-foreground/70">Physics · Chapter 7 · Topic 3</p><div className="mt-8 h-2 overflow-hidden rounded-full bg-secondary-foreground/15"><div className="h-full w-[68%] rounded-full bg-primary" /></div><p className="mt-2 text-right text-[11px] font-semibold text-secondary-foreground/65">68% through</p></div>
                <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Your shelf</p><div className="rounded-2xl border border-border bg-background p-4"><div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></div><p className="font-semibold">Science</p><p className="mt-1 text-xs text-muted-foreground">12 topics ready</p></div><div className="rounded-2xl border border-border bg-background p-4"><div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-accent/50 text-accent-foreground"><GraduationCap className="h-5 w-5" /></div><p className="font-semibold">Mathematics</p><p className="mt-1 text-xs text-muted-foreground">8 topics ready</p></div></div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground"><MapPin className="h-4 w-4 text-primary" /> St. Mira's School · CBSE · Class 8</div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/70" id="how-it-works">
          <div className="mx-auto grid max-w-7xl gap-0 px-5 sm:px-8 lg:grid-cols-3 lg:px-12">
            {[['01', 'Choose your context', 'Tell us your city, board, school and class. Your syllabus becomes the home screen.'], ['02', 'Find the exact topic', 'Move from subject to book to chapter to topic without losing your place.'], ['03', 'Keep moving', 'Students pick up where they left off. Teachers see the same structure from the other side.']].map(([number, title, copy]) => <div key={number} className="border-b border-border px-0 py-9 last:border-0 lg:border-b-0 lg:border-r lg:px-10 lg:first:pl-0 lg:last:border-r-0"><p className="font-mono text-xs font-semibold text-primary">{number}</p><h2 className="mt-4 font-display text-2xl">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p></div>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28" id="for-schools">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">A calmer kind of clarity</p><h2 className="mt-4 max-w-lg font-display text-4xl leading-tight sm:text-5xl">Less portal.<br />More school day.</h2><p className="mt-5 max-w-md leading-7 text-muted-foreground">The best learning tools do not compete for attention. Pathshala keeps the structure visible, the language familiar and the next step obvious.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-3xl border border-border bg-card p-7 paper-shadow"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><UsersRound className="h-5 w-5" /></div><h3 className="mt-8 font-display text-2xl">For students</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">A shelf that remembers your books, your chapters and the topic you were last working through.</p></article><article className="rounded-3xl border border-border bg-secondary p-7"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary-foreground/10 text-secondary-foreground"><GraduationCap className="h-5 w-5" /></div><h3 className="mt-8 font-display text-2xl text-secondary-foreground">For teachers</h3><p className="mt-3 text-sm leading-6 text-secondary-foreground/70">A precise view of the classes and subjects you guide, mapped to the same curriculum.</p></article></div>
          </div>
        </section>

        <section className="mx-5 overflow-hidden rounded-[2rem] bg-sidebar px-6 py-14 text-sidebar-foreground sm:mx-8 sm:px-12 lg:mx-auto lg:max-w-7xl lg:px-20 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-accent">Your next lesson is closer than it looks</p><h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Open the syllabus.<br />Get on with learning.</h2></div><Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground" data-testid="link-bottom-start">Start with your school <ArrowRight className="h-4 w-4" /></Link></div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><Brand /><span>Thoughtfully structured for Indian classrooms.</span><span className="sr-only" data-testid="status-platform-health">{health.isSuccess ? 'Platform ready' : health.isError ? 'Platform status unavailable' : 'Checking platform status'}</span></footer>
    </div>
  );
}