import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { getGetMeQueryKey, useGetMe } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoadingScreen } from '@/components/app-shell';
import Landing from '@/pages/landing';
import Onboarding from '@/pages/onboarding';
import StudentDashboardPage from '@/pages/student';
import TeacherDashboardPage from '@/pages/teacher';
import CurriculumPage from '@/pages/curriculum';
import AdminPage from '@/pages/admin';
import SettingsPage from '@/pages/settings';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
// The managed Clerk publishable key is injected at runtime; keep this resolver
// host-aware so the same artifact can serve preview and published domains.
const clerkPubKey = resolveClerkPublishableKey(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function resolveClerkPublishableKey(_hostname: string, key?: string) {
  return key ?? '';
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#D4782C', colorForeground: '#203447', colorMutedForeground: '#69747d', colorDanger: '#b94036', colorBackground: '#fffaf0', colorInput: '#fffdf8', colorInputForeground: '#203447', colorNeutral: '#dfd8cb', fontFamily: 'DM Sans, sans-serif', borderRadius: '0.75rem' },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffaf0] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-display text-[#203447]',
    headerSubtitle: 'text-[#69747d]',
    socialButtonsBlockButtonText: 'text-[#203447]',
    formFieldLabel: 'text-[#203447]',
    footerActionLink: 'text-[#b65f1d]',
    footerActionText: 'text-[#69747d]',
    dividerText: 'text-[#69747d]',
    identityPreviewEditButton: 'text-[#b65f1d]',
    formFieldSuccessText: 'text-[#26734a]',
    alertText: 'text-[#203447]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#dfd8cb] bg-[#fffdf8]',
    formButtonPrimary: 'bg-[#d4782c] text-[#fffaf0] hover:bg-[#b65f1d]',
    formFieldInput: 'border-[#dfd8cb] bg-[#fffdf8] text-[#203447]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#dfd8cb]',
    alert: 'border-[#dfd8cb] bg-[#f4efe5]',
    otpCodeFieldInput: 'border-[#dfd8cb] bg-[#fffdf8] text-[#203447]',
    formFieldRow: 'gap-2',
    main: 'bg-transparent',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (previous.current !== undefined && previous.current !== id) client.clear();
      previous.current = id;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function SignInPage() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background px-4 py-8"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background px-4 py-8"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const me = useGetMe({ query: { enabled: Boolean(isLoaded && isSignedIn), queryKey: getGetMeQueryKey() } });
  useEffect(() => {
    if (isLoaded && isSignedIn && me.data) setLocation(me.data.onboardingComplete ? me.data.role === 'teacher' ? '/teacher' : me.data.role === 'admin' ? '/admin' : '/student' : '/onboarding');
  }, [isLoaded, isSignedIn, me.data, setLocation]);
  if (!isLoaded || (isSignedIn && me.isLoading)) return <LoadingScreen />;
  return isSignedIn ? <LoadingScreen label="Opening your study desk" /> : <Landing />;
}

function AppRoutes() {
  return <Switch><Route path="/" component={HomeRedirect} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route path="/onboarding" component={Onboarding} /><Route path="/student" component={StudentDashboardPage} /><Route path="/teacher" component={TeacherDashboardPage} /><Route path="/admin" component={AdminPage} /><Route path="/curriculum" component={CurriculumPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <ErrorBoundary><ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Open your school study desk' } }, signUp: { start: { title: 'Create your study desk', subtitle: 'Start with your school context' } } }} routerPush={(to: string) => { window.history.pushState({}, '', `${basePath}${stripBase(to)}` || '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} routerReplace={(to: string) => { window.history.replaceState({}, '', `${basePath}${stripBase(to)}` || '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}><QueryClientProvider client={queryClient}><TooltipProvider><ClerkQueryClientCacheInvalidator /><WouterRouter base={basePath}><AppRoutes /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider></ClerkProvider></ErrorBoundary>;
}

export default App;