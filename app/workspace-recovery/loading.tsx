export default function WorkspaceRecoveryLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <h1 className="text-lg font-semibold">Recovering your workspace...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re repairing your account state and routing you back in.
        </p>
      </div>
    </div>
  );
}

