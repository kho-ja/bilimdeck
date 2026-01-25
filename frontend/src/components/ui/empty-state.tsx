import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'card' | 'plain';
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'card',
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <svg
        className="h-20 w-20 text-muted-foreground"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="40" cy="40" r="28" className="stroke-current" strokeWidth="2" />
        <path
          d="M26 40h28M40 26v28"
          className="stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );

  if (variant === 'plain') {
    return content;
  }

  return (
    <Card>
      <CardContent className="py-12">{content}</CardContent>
    </Card>
  );
}
