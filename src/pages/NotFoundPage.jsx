import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <div className="text-center py-24">
      <div className="text-6xl font-display font-light text-muted-foreground/60 mb-2">404</div>
      <h1 className="text-2xl font-display font-bold mb-2">{t('notFound')}</h1>
      <p className="text-muted-foreground mb-6">{t('notFoundText')}</p>
      <Link to="/study"><Button variant="outline">{t('goHome')}</Button></Link>
    </div>
  );
}
