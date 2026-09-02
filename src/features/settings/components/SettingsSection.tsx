import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { type SubCategoryRecord } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { SettingsCategoryPanel } from './SettingsCategoryPanel';
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
  const [expensesOpen, setExpensesOpen] = useState(true);
  const [futureOpen, setFutureOpen] = useState(true);
  const [recurringOpen, setRecurringOpen] = useState(true);
  const [oneTimeOpen, setOneTimeOpen] = useState(true);

  return (
    <section>
      <SettingsCategoryPanel
        title={t('profile.settings.categories.expenses')}
        open={expensesOpen}
        onToggle={() => setExpensesOpen((prev) => !prev)}
      >
        <SettingsCategoryPanel
          title={t('profile.settings.subcategories.futureExpenses')}
          open={futureOpen}
          onToggle={() => setFutureOpen((prev) => !prev)}
          nested
        >
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            <SettingsCategoryPanel
              title={t('profile.settings.subcategories.recurringExpenses')}
              open={recurringOpen}
              onToggle={() => setRecurringOpen((prev) => !prev)}
              nested
            >
              {activeTemplates.length === 0 ? (
                <p className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400 text-center">
                  {t('profile.settings.recurring.empty')}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
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
            </SettingsCategoryPanel>

            <SettingsCategoryPanel
              title={t('profile.settings.subcategories.oneTimeExpenses')}
              open={oneTimeOpen}
              onToggle={() => setOneTimeOpen((prev) => !prev)}
              nested
            >
              {scheduledExpenses.length === 0 ? (
                <p className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400 text-center">
                  {t('profile.settings.oneTime.empty')}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
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
            </SettingsCategoryPanel>
          </div>
        </SettingsCategoryPanel>
      </SettingsCategoryPanel>
    </section>
  );
}
