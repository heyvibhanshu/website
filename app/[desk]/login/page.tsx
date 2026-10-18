import { LoginForm } from "@/components/admin/login-form";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireAdminRoute } from "@/lib/admin-route";
export const metadata = { title: "Sign In" };
export default async function Login({
  searchParams,
  params,
}: {
  searchParams: Promise<{ error?: string }>;
  params: Promise<{ desk: string }>;
}) {
  await requireAdminRoute(params);
  const { error } = await searchParams;
  const configured = Boolean(supabaseConfig());
  return (
    <>
      <div className="page-heading">
        <h1>the writing desk.</h1>
        <p>A quiet place to put thoughts into words.</p>
      </div>
      {configured ? (
        <>
          {error && (
            <p role="alert" className="form-error">
              This account isn’t authorized. Sign in with the owner account.
            </p>
          )}
          <LoginForm />
        </>
      ) : (
        <div className="setup-note">
          <h2>A little setup first.</h2>
          <p>
            Connect Supabase and authorize your owner account to open the
            writing desk.
          </p>
          <p>
            Follow <code>docs/setup.md</code> in the repository, then add the
            environment variables and restart the app.
          </p>
        </div>
      )}
    </>
  );
}
