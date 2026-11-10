export function MemberPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="member-page-header">
      <h1 className="type-page">{title}</h1>
      {description ? (
        <p className="type-caption mt-1.5 max-w-[40ch] text-muted">{description}</p>
      ) : null}
    </header>
  );
}
