import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CalendarClock, Receipt, Repeat } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type SubCategoryRecord } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { ACCORDION_EMPTY_CONTENT_CLASS, AppAccordion } from '../../../components/accordion';
import { ActiveRecurringExpenseListItem } from './ActiveRecurringExpenseListItem';
import { ActiveScheduledExpenseListItem } from './ActiveScheduledExpenseListItem';

interface SettingsSectionProps {
  activeTemplates: Expense[];
  scheduledExpenses: Expense[];
  expenses: Expense[];
  locale: AppLocale;
  subCategories: SubCategoryRecord[];
  onEditRecurring: (template: Expense) => void;
  onDeleteRecurring: (template: Expense) => void;
  onEditScheduled: (expense: Expense) => void;
  onDeleteScheduled: (expense: Expense) => void;
}

export function SettingsSection({
  activeTemplates,
  scheduledExpenses,
  expenses,
  locale,
  subCategories,
  onEditRecurring,
  onDeleteRecurring,
  onEditScheduled,
  onDeleteScheduled,
}: SettingsSectionProps) {
  const { t } = useTranslation();
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [futureOpen, setFutureOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [oneTimeOpen, setOneTimeOpen] = useState(false);

  return (
    <section>
      <AppAccordion
        title={t('profile.settings.categories.expenses')}
        subtitle={t('profile.settings.categories.expensesSubtitle')}
        icon={Receipt}
        open={expensesOpen}
        onToggle={() => setExpensesOpen((prev) => !prev)}
        variant="parent"
      >
        <AppAccordion
          title={t('profile.settings.subcategories.futureExpenses')}
          subtitle={t('profile.settings.subcategories.futureExpensesSubtitle')}
          icon={CalendarClock}
          open={futureOpen}
          onToggle={() => setFutureOpen((prev) => !prev)}
          variant="nested"
        >
          <AppAccordion
            title={t('profile.settings.subcategories.recurringExpenses')}
            subtitle={t('profile.settings.subcategories.recurringExpensesSubtitle')}
            icon={Repeat}
            open={recurringOpen}
            onToggle={() => setRecurringOpen((prev) => !prev)}
            variant="nested"
          >
            {activeTemplates.length === 0 ? (
              <p className={ACCORDION_EMPTY_CONTENT_CLASS}>
                {t('profile.settings.recurring.empty')}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-600/70">
                {activeTemplates.map((template) => (
                  <ActiveRecurringExpenseListItem
                    key={template.id}
                    template={template}
                    expenses={expenses}
                    locale={locale}
                    subCategories={subCategories}
                    onEdit={() => onEditRecurring(template)}
                    onDelete={() => onDeleteRecurring(template)}
                  />
                ))}
              </ul>
            )}
          </AppAccordion>

          <AppAccordion
            title={t('profile.settings.subcategories.oneTimeExpenses')}
            subtitle={t('profile.settings.subcategories.oneTimeExpensesSubtitle')}
            icon={Calendar}
            open={oneTimeOpen}
            onToggle={() => setOneTimeOpen((prev) => !prev)}
            variant="nested"
          >
            {scheduledExpenses.length === 0 ? (
              <p className={ACCORDION_EMPTY_CONTENT_CLASS}>
                {t('profile.settings.oneTime.empty')}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-600/70">
                {scheduledExpenses.map((expense) => (
                  <ActiveScheduledExpenseListItem
                    key={expense.id}
                    expense={expense}
                    locale={locale}
                    subCategories={subCategories}
                    onEdit={() => onEditScheduled(expense)}
                    onDelete={() => onDeleteScheduled(expense)}
                  />
                ))}
              </ul>
            )}
          </AppAccordion>
        </AppAccordion>
      </AppAccordion>
    </section>
  );
}
