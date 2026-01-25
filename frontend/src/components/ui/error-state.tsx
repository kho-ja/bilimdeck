import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  actionLabel,
  onAction,
}: ErrorStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        {onRetry && retryLabel && (
          <Button variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
