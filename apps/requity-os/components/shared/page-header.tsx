interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-6 md:mb-8 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-[-0.04em] text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
