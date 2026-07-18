import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ExpensesProvider } from './app/providers/ExpensesProvider';
import { CategoriesProvider } from './app/providers/CategoriesProvider';
import { ROUTES } from './config/routes';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ExpenseDetailPage } from './pages/ExpenseDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';
import { CategoryEditorPage } from './pages/CategoryEditorPage';

function App() {
  return (
    <BrowserRouter>
      <ExpensesProvider>
        <CategoriesProvider>
          <Routes>
          <Route element={<AppShell />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.expenses} element={<ExpensesPage />} />
            <Route path={ROUTES.expenseDetail} element={<ExpenseDetailPage />} />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.categoryManagement} element={<CategoryManagementPage />} />
            <Route path={ROUTES.categoryCreate} element={<CategoryEditorPage />} />
            <Route path={ROUTES.categoryEdit} element={<CategoryEditorPage />} />
          </Route>
        </Routes>
        </CategoriesProvider>
      </ExpensesProvider>
    </BrowserRouter>
  );
}

export default App;
