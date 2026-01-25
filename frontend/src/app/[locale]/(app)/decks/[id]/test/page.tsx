'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function DeckTestPlaceholderPage() {
  const t = useTranslations('deckDetails');
  const router = useRouter();
  const params = useParams();
  const deckId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {t('testTitle')}
        </CardTitle>
        <CardDescription>{t('testDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToDeck')}
        </Button>
      </CardContent>
    </Card>
  );
}
