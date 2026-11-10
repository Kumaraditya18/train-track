import { MemberShell } from "@/components/shell/MemberShell";
import { requireProfile } from "@/lib/auth/profile";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <MemberShell displayName={profile.display_name} isAdmin={profile.role === "admin"}>
      {children}
    </MemberShell>
  );
}
