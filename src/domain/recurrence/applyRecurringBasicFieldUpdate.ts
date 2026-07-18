import { type Expense } from '../../types/expense';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import { capTemplateEndDate } from './earliestEndDate';
import {
  computeRemainingOccurrences,
  remainingOccurrencesToRuleLimit,
} from './occurrencesRemaining';
import { resolveSeriesRootId, resolveSeriesTemplate } from './resolveSeriesTemplate';

export type RecurrenceBasicFieldEditScope = 'instanceOnly' | 'thisAndFuture';

export type RecurringBasicFields = Pick<
  Expense,
  'description' | 'amount' | 'category' | 'paymentMethod'
>;

function dayBefore(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
}

function dayAfter(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}

function mergeBasicFields(expense: Expense, fields: RecurringBasicFields): Expense {
  return {
    ...expense,
    description: fields.description,
    amount: fields.amount,
    category: fields.category,
    paymentMethod: fields.paymentMethod,
  };
}

function shouldUpdateMaterializedThisAndFuture(
  expense: Expense,
  rootId: string,
  splitDateIso: string,
): boolean {
  if (expense.id === rootId) {
    return expense.date >= splitDateIso;
  }
  return expense.recurrenceSeriesId === rootId && expense.date >= splitDateIso;
}

function buildSuccessorTemplate(
  template: Expense,
  updatedFields: RecurringBasicFields,
  effectiveFromIso: string,
): Expense {
  const merged = mergeBasicFields(
    {
      ...template,
      id: crypto.randomUUID(),
      date: effectiveFromIso,
    },
    updatedFields,
  );

  const {
    recurrenceSeriesId: _seriesId,
    recurrenceEndDate: _endDate,
    ...rest
  } = merged;

  // Do not copy recurrenceEndDate: that field caps the *old* series portion after a
  // prior split/termination. The successor is a fresh continuation.
  return {
    ...rest,
    recurrenceRule: template.recurrenceRule,
    ...(template.recurrenceExcludedDates
      ? {
          recurrenceExcludedDates: template.recurrenceExcludedDates.filter(
            (date) => date >= effectiveFromIso,
          ),
        }
      : {}),
  };
}

function adjustSuccessorOccurrenceBudget(
  successor: Expense,
  priorLimit: number | null,
  priorConsumedCount: number,
  successorMaterializedCount: number,
): Expense {
  if (!successor.recurrenceRule) {
    return successor;
  }

  const remaining = computeRemainingOccurrences(priorLimit, priorConsumedCount);
  // Exclusions copied onto the successor were already in priorConsumedCount; include them
  // in the successor base so remaining display does not drop after the split.
  const successorExcludedCount = successor.recurrenceExcludedDates?.length ?? 0;
  const adjustedLimit = remainingOccurrencesToRuleLimit(
    remaining,
    successorMaterializedCount + successorExcludedCount,
  );

  return {
    ...successor,
    recurrenceRule: {
      ...successor.recurrenceRule,
      occurrences: adjustedLimit,
    },
  };
}

/**
 * Prior settings/timeline splits leave a capped template plus a continuation template
 * starting the day after that cap. Walk that chain and collect continuations that start
 * on/after the new split so "this and future" reaches them.
 */
function findContinuationTemplateIds(
  expenses: Expense[],
  template: Expense,
  splitDateIso: string,
): Set<string> {
  const ids = new Set<string>();
  let cursorEnd = template.recurrenceEndDate;

  while (cursorEnd) {
    const nextStart = dayAfter(cursorEnd);
    const next = expenses.find(
      (expense) =>
        expense.recurrenceRule !== undefined &&
        expense.id !== template.id &&
        !ids.has(expense.id) &&
        expense.date === nextStart,
    );

    if (!next) break;

    if (next.date >= splitDateIso) {
      ids.add(next.id);
    }

    cursorEnd = next.recurrenceEndDate;
    if (!cursorEnd) break;
  }

  return ids;
}

function countConsumedInSplitFamily(
  expenses: Expense[],
  template: Expense,
  continuationIds: Set<string>,
): number {
  let materialized = 0;
  let excluded = template.recurrenceExcludedDates?.length ?? 0;

  for (const expense of expenses) {
    const inRoot =
      expense.id === template.id || expense.recurrenceSeriesId === template.id;
    const isContinuationTemplate = continuationIds.has(expense.id);
    const inContinuation =
      expense.recurrenceSeriesId !== undefined &&
      continuationIds.has(expense.recurrenceSeriesId);

    if (inRoot || isContinuationTemplate || inContinuation) {
      materialized += 1;
    }

    if (isContinuationTemplate) {
      excluded += expense.recurrenceExcludedDates?.length ?? 0;
    }
  }

  return materialized + excluded;
}

function applyThisAndFutureWithSeriesSplit(
  expenses: Expense[],
  template: Expense,
  rootId: string,
  updatedFields: RecurringBasicFields,
  splitDateIso: string,
): Expense[] {
  const endDate = dayBefore(splitDateIso);
  const successorTemplate = buildSuccessorTemplate(template, updatedFields, splitDateIso);
  const successorId = successorTemplate.id;
  const continuationIds = findContinuationTemplateIds(expenses, template, splitDateIso);

  const cappedOldTemplate = capTemplateEndDate(template, endDate);

  const withoutAbsorbed = expenses.filter((expense) => {
    if (expense.id === template.id) return true;
    if (continuationIds.has(expense.id)) return false;
    if (expense.recurrenceSeriesId && continuationIds.has(expense.recurrenceSeriesId)) {
      // Keep continuation instances; reassign below — unless on split date (successor owns it)
      if (expense.date === splitDateIso) return false;
      return true;
    }
    if (expense.recurrenceSeriesId === rootId && expense.date === splitDateIso) {
      return false;
    }
    return true;
  });

  const withReassigned = withoutAbsorbed.map((expense) => {
    if (expense.id === template.id) {
      return cappedOldTemplate;
    }

    if (expense.recurrenceSeriesId === rootId && expense.date > splitDateIso) {
      return {
        ...mergeBasicFields(expense, updatedFields),
        recurrenceSeriesId: successorId,
      };
    }

    if (
      expense.recurrenceSeriesId &&
      continuationIds.has(expense.recurrenceSeriesId) &&
      expense.date > splitDateIso
    ) {
      return {
        ...mergeBasicFields(expense, updatedFields),
        recurrenceSeriesId: successorId,
      };
    }

    return expense;
  });

  // Continuation templates that started after splitDate become instances of the successor
  // when their date is after the successor anchor; the split-date row is the successor itself.
  const continuationAsInstances: Expense[] = [];
  for (const expense of expenses) {
    if (!continuationIds.has(expense.id)) continue;
    if (expense.date === splitDateIso) continue;
    if (expense.date < splitDateIso) continue;

    const { recurrenceRule: _rule, recurrenceEndDate: _end, recurrenceExcludedDates: _ex, ...rest } =
      mergeBasicFields(expense, updatedFields);

    continuationAsInstances.push({
      ...rest,
      recurrenceSeriesId: successorId,
    });
  }

  const resultBeforeBudget = withReassigned
    .concat(successorTemplate)
    .concat(continuationAsInstances);
  // Include continuation templates/instances already split off earlier; otherwise repeated
  // thisAndFuture edits under-count prior consumption and inflate the successor limit.
  const priorSeriesCount = countConsumedInSplitFamily(expenses, template, continuationIds);
  const successorCount = resultBeforeBudget.filter(
    (expense) => expense.id === successorId || expense.recurrenceSeriesId === successorId,
  ).length;
  const priorLimit = template.recurrenceRule?.occurrences ?? null;
  const adjustedSuccessor = adjustSuccessorOccurrenceBudget(
    successorTemplate,
    priorLimit,
    priorSeriesCount,
    successorCount,
  );
  const result = resultBeforeBudget.map((expense) =>
    expense.id === successorId ? adjustedSuccessor : expense,
  );
  return result;
}

function applyThisAndFutureInPlace(
  expenses: Expense[],
  template: Expense,
  rootId: string,
  updatedFields: RecurringBasicFields,
  splitDateIso: string,
): Expense[] {
  const continuationIds = findContinuationTemplateIds(expenses, template, splitDateIso);

  return expenses.map((expense) => {
    if (shouldUpdateMaterializedThisAndFuture(expense, rootId, splitDateIso)) {
      return mergeBasicFields(expense, updatedFields);
    }

    if (continuationIds.has(expense.id)) {
      return mergeBasicFields(expense, updatedFields);
    }

    if (
      expense.recurrenceSeriesId &&
      continuationIds.has(expense.recurrenceSeriesId) &&
      expense.date >= splitDateIso
    ) {
      return mergeBasicFields(expense, updatedFields);
    }

    return expense;
  });
}

export function applyRecurringBasicFieldUpdate(
  expenses: Expense[],
  target: Expense,
  updatedFields: RecurringBasicFields,
  scope: RecurrenceBasicFieldEditScope,
  splitDateIso: string,
): Expense[] {
  if (scope === 'instanceOnly') {
    return expenses.map((expense) =>
      expense.id === target.id ? mergeBasicFields(expense, updatedFields) : expense,
    );
  }

  const rootId = resolveSeriesRootId(target);
  if (!rootId) {
    return expenses.map((expense) =>
      expense.id === target.id ? mergeBasicFields(expense, updatedFields) : expense,
    );
  }

  const template = resolveSeriesTemplate(expenses, target);
  if (!template?.recurrenceRule) {
    return applyThisAndFutureInPlace(
      expenses,
      target,
      rootId,
      updatedFields,
      splitDateIso,
    );
  }

  if (template.date < splitDateIso) {
    return applyThisAndFutureWithSeriesSplit(
      expenses,
      template,
      rootId,
      updatedFields,
      splitDateIso,
    );
  }

  return applyThisAndFutureInPlace(
    expenses,
    template,
    rootId,
    updatedFields,
    splitDateIso,
  );
}
