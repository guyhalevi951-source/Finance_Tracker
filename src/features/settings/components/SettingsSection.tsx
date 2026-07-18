import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type SubCategoryRecord } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { SettingsCategoryPanel } from './SettingsCategoryPanel';
import { ActiveRecurringExpenseListItem } from './ActiveRecurringExpenseListItem';

interface SettingsSectionProps {
  activeTemplates: Expense[];
  expenses: Expense[];
  locale: AppLocale;
  subCategories: SubCategoryRecord[];
  onEdit: (template: Expense) => void;
  onDelete: (template: Expense) => void;
}

export function SettingsSection({
  activeTemplates,
  expenses,
  locale,
  subCategories,
  onEdit,
  onDelete,
}: SettingsSectionProps) {
  const { t } = useTranslation();
  const [expensesOpen, setExpensesOpen] = useState(true);
  const [recurringOpen, setRecurringOpen] = useState(true);

  return (
    <section className="mt-6">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3 px-1">
        {t('profile.settings.title')}
      </h2>

      <div className="space-y-3">
        <SettingsCategoryPanel
          title={t('profile.settings.categories.expenses')}
          open={expensesOpen}
          onToggle={() => setExpensesOpen((prev) => !prev)}
        >
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
                    onEdit={() => onEdit(template)}
                    onDelete={() => onDelete(template)}
                  />
                ))}
              </ul>
            )}
          </SettingsCategoryPanel>
        </SettingsCategoryPanel>
      </div>
    </section>
  );
}
