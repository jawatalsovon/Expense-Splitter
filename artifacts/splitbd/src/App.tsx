import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import GroupPage from "@/pages/GroupPage";
import NotFound from "@/pages/not-found";

function RedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <RedirectIfLoggedIn>
          <Landing />
        </RedirectIfLoggedIn>
      </Route>
      <Route path="/login">
        <RedirectIfLoggedIn>
          <Login />
        </RedirectIfLoggedIn>
      </Route>
      <Route path="/signup">
        <RedirectIfLoggedIn>
          <Signup />
        </RedirectIfLoggedIn>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/group/:groupId">
        <ProtectedRoute>
          <GroupPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  );
}

export default App;
