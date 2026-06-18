import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  return (
    <button
      onClick={() => i18n.changeLanguage(isFr ? 'en' : 'fr')}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-card border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-cta transition-colors duration-200 cursor-pointer"
    >
      {isFr ? 'EN' : 'FR'}
    </button>
  );
}
