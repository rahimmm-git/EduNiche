import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronLeft, LoaderCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  getGetMeQueryKey,
  getGetOnboardingOptionsQueryKey,
  useGetOnboardingOptions,
  useUpdateMe,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { LoadingScreen, ErrorState, Brand, ProtectedPage } from '@/components/app-shell';
import { cn } from '@/lib/utils';

export default function Onboarding() {
  return <ProtectedPage><OnboardingContent /></ProtectedPage>;
}

function OnboardingContent() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState('');
  const [boardId, setBoardId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectIds, setSubjectIds] = useState<number[]>([]);
  const params = useMemo(() => ({ cityId: cityId ? Number(cityId) : undefined, boardId: boardId ? Number(boardId) : undefined, schoolId: schoolId ? Number(schoolId) : undefined }), [cityId, boardId, schoolId]);
  const options = useGetOnboardingOptions(params, { query: { queryKey: getGetOnboardingOptionsQueryKey(params) } });
  const updateMe = useUpdateMe();
  const schools = options.data?.schools ?? [];
  const classes = options.data?.classes ?? [];
  const subjects = options.data?.subjects ?? [];
  const selectedClassSubjects = subjects.filter((subject) => !classId || subject.classId === Number(classId));
  const canContinue = step === 0 ? Boolean(name.trim()) : step === 1 ? Boolean(cityId && boardId && schoolId) : role === 'student' ? Boolean(classId) : Boolean(subjectIds.length);

  if (options.isLoading) return <LoadingScreen label="Preparing your school options" />;
  if (options.isError || !options.data) return <div className="grid min-h-[100dvh] place-items-center p-6"><ErrorState message="Your school options are taking a moment to arrive." onRetry={() => options.refetch()} /></div>;

  const submit = () => {
    if (!canContinue || step < 2) {
      if (canContinue) setStep((current) => current + 1);
      return;
    }
    updateMe.mutate({ data: { name: name.trim(), role, cityId: Number(cityId), boardId: Number(boardId), schoolId: Number(schoolId), classId: role === 'student' ? Number(classId) : null, teacherAssignments: role === 'teacher' ? subjectIds.map((subjectId) => ({ subjectId, classId: Number(classId || classes[0]?.id) })) : undefined } }, {
      onSuccess: (profile) => {
        queryClient.setQueryData(getGetMeQueryKey(), profile);
        setLocation(profile.role === 'teacher' ? '/teacher' : '/student');
      },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8"><Brand /><span className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Set up your desk</span></header>
      <main className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[.65fr_1fr] lg:pt-20">
        <div className="reveal"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><BookOpen className="h-6 w-6" /></div><p className="mt-8 text-xs font-semibold uppercase tracking-[.18em] text-primary">A little context goes a long way</p><h1 className="mt-4 max-w-md font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">Make it yours.</h1><p className="mt-5 max-w-md leading-7 text-muted-foreground">We use your school context to show the exact curriculum you need. You can change it later from your profile.</p><div className="mt-10 flex items-center gap-2">{[0, 1, 2].map((item) => <span key={item} className={cn('h-1.5 rounded-full transition-all', item === step ? 'w-10 bg-primary' : item < step ? 'w-6 bg-accent' : 'w-6 bg-border')} />)}</div></div>
        <div className="rounded-[2rem] border border-border bg-card p-6 paper-shadow sm:p-9">
          {step === 0 && <div className="reveal"><p className="text-sm font-semibold text-primary">Step 1 of 3</p><h2 className="mt-3 font-display text-3xl">Tell us who is learning.</h2><p className="mt-2 text-sm text-muted-foreground">This helps us set the right starting view.</p><label className="mt-8 block text-sm font-semibold">Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ananya Rao" className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-onboarding-name" /></label><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setRole('student')} className={cn('rounded-2xl border p-5 text-left transition-colors', role === 'student' ? 'border-primary bg-primary/5' : 'border-border')} data-testid="button-role-student"><span className="font-semibold">I am a student</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Keep track of my subjects and topics.</span></button><button type="button" onClick={() => setRole('teacher')} className={cn('rounded-2xl border p-5 text-left transition-colors', role === 'teacher' ? 'border-primary bg-primary/5' : 'border-border')} data-testid="button-role-teacher"><span className="font-semibold">I am a teacher</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">See my classes and teaching subjects.</span></button></div></div>}
          {step === 1 && <div className="reveal"><p className="text-sm font-semibold text-primary">Step 2 of 3</p><h2 className="mt-3 font-display text-3xl">Find your school.</h2><p className="mt-2 text-sm text-muted-foreground">Start broad, then narrow it down.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><SelectField label="City" value={cityId} onChange={(value) => { setCityId(value); setSchoolId(''); }} options={options.data.cities.map((item) => [item.id, item.name])} testId="select-city" /><SelectField label="Board" value={boardId} onChange={(value) => { setBoardId(value); setSchoolId(''); }} options={options.data.boards.map((item) => [item.id, item.name])} testId="select-board" /></div><SelectField label="School" value={schoolId} onChange={setSchoolId} options={schools.filter((school) => (!cityId || school.cityId === Number(cityId)) && (!boardId || school.boardId === Number(boardId))).map((item) => [item.id, item.name])} testId="select-school" /></div>}
          {step === 2 && <div className="reveal"><p className="text-sm font-semibold text-primary">Step 3 of 3</p><h2 className="mt-3 font-display text-3xl">{role === 'student' ? 'Choose your class.' : 'Choose your teaching shelf.'}</h2><p className="mt-2 text-sm text-muted-foreground">{role === 'student' ? 'Your books and topics will follow this class.' : 'Pick a class and one or more subjects you teach.'}</p><SelectField label="Class" value={classId} onChange={(value) => { setClassId(value); setSubjectIds([]); }} options={classes.filter((item) => item.schoolId === Number(schoolId)).map((item) => [item.id, item.name])} testId="select-class" />{role === 'teacher' && <div className="mt-7"><p className="text-sm font-semibold">Subjects</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{selectedClassSubjects.map((subject) => <button key={subject.id} type="button" onClick={() => setSubjectIds((current) => current.includes(subject.id) ? current.filter((id) => id !== subject.id) : [...current, subject.id])} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left text-sm', subjectIds.includes(subject.id) ? 'border-primary bg-primary/5' : 'border-border')} data-testid={`button-subject-${subject.id}`}><span className={cn('grid h-7 w-7 place-items-center rounded-lg text-xs font-bold', subjectIds.includes(subject.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{subjectIds.includes(subject.id) ? <Check className="h-4 w-4" /> : subject.name.slice(0, 1)}</span>{subject.name}</button>)}</div></div>}</div>}
          <div className="mt-10 flex items-center justify-between border-t border-border pt-5"><button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground disabled:opacity-40" onClick={() => setStep((current) => current - 1)} disabled={step === 0 || updateMe.isPending} data-testid="button-onboarding-back"><ChevronLeft className="h-4 w-4" /> Back</button><Button onClick={submit} disabled={!canContinue || updateMe.isPending} data-testid="button-onboarding-continue">{updateMe.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : step === 2 ? 'Open my desk' : 'Continue'}{!updateMe.isPending && <ArrowRight className="h-4 w-4" />}</Button></div>
          {updateMe.isError && <p className="mt-4 text-sm text-destructive" data-testid="status-onboarding-error">We could not save this context. Please check your selections and try again.</p>}
        </div>
      </main>
    </div>
  );
}

function SelectField({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (value: string) => void; options: [number, string][]; testId: string }) {
  return <label className="mt-5 block text-sm font-semibold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid={testId}><option value="">Choose {label.toLowerCase()}</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}