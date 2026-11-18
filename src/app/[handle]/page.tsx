export const instant = false;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <p className="text-sm text-muted">
        @{handle} — profile page coming in the next phase.
      </p>
    </main>
  );
}
