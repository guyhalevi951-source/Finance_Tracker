import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ExpensesProvider } from './app/providers/ExpensesProvider';
import { CategoriesProvider } from './app/providers/CategoriesProvider';
import { ROUTES } from './config/routes';
import { PeriodicOverviewPage } from './pages/PeriodicOverviewPage';
import { BudgetSettingsPage } from './pages/BudgetSettingsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';
import { CategoryEditorPage } from './pages/CategoryEditorPage';
import { SubCategoryManagementPage } from './pages/SubCategoryManagementPage';
import { SubCategoryEditorPage } from './pages/SubCategoryEditorPage';

function App() {
  return (
    <BrowserRouter>
      <ExpensesProvider>
        <CategoriesProvider>
          <Routes>
          <Route element={<AppShell />}>
            <Route path={ROUTES.overview} element={<PeriodicOverviewPage />} />
            <Route path={ROUTES.budget} element={<BudgetSettingsPage />} />
            <Route path={ROUTES.expenses} element={<ExpensesPage />} />
            <Route path={ROUTES.expenseDetail} element={<ExpenseDetailPage />} />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route path={ROUTES.categoryManagement} element={<CategoryManagementPage />} />
            <Route path={ROUTES.categoryCreate} element={<CategoryEditorPage />} />
            <Route path={ROUTES.categoryEdit} element={<CategoryEditorPage />} />
            <Route path={ROUTES.categorySubManagement} element={<SubCategoryManagementPage />} />
            <Route path={ROUTES.categorySubCreate} element={<SubCategoryEditorPage />} />
            <Route path={ROUTES.categorySubEdit} element={<SubCategoryEditorPage />} />
          </Route>
        </Routes>
        </CategoriesProvider>
      </ExpensesProvider>
    </BrowserRouter>
  );
}

export default App;
