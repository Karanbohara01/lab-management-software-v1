import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { RequirePermission } from './RequirePermission';
import { lazyPage } from './lazyPage';
import { PERMISSIONS } from '@/features/auth/permissions';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ForbiddenPage, NotFoundPage } from '@/pages/ErrorPages';

const P = PERMISSIONS;

/** A child route whose element is lazily loaded and (optionally) permission-gated. */
function route(path: string, element: ReactNode, anyOf?: string[]) {
  return {
    path,
    element: anyOf ? <RequirePermission anyOf={anyOf}>{element}</RequirePermission> : element,
  };
}

export const router = createBrowserRouter([
  { path: '/', element: lazyPage(() => import('@/features/marketing/LandingPage'), 'LandingPage') },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },

      route('patients', lazyPage(() => import('@/features/patients/PatientsPage'), 'PatientsPage'), [P.PATIENT_READ]),
      route('patients/new', lazyPage(() => import('@/features/patients/RegisterPatientPage'), 'RegisterPatientPage'), [P.PATIENT_WRITE]),
      route('patients/:id', lazyPage(() => import('@/features/patients/PatientDetailPage'), 'PatientDetailPage'), [P.PATIENT_READ]),
      route('patients/:id/edit', lazyPage(() => import('@/features/patients/RegisterPatientPage'), 'RegisterPatientPage'), [P.PATIENT_WRITE]),
      route('doctors', lazyPage(() => import('@/features/doctors/DoctorsPage'), 'DoctorsPage'), [P.DOCTOR_READ]),
      route('departments', lazyPage(() => import('@/features/departments/DepartmentsPage'), 'DepartmentsPage'), [P.DEPARTMENT_READ]),
      route('tests', lazyPage(() => import('@/features/catalog/TestCatalogPage'), 'TestCatalogPage'), [P.TEST_CATALOG_READ]),

      route('orders', lazyPage(() => import('@/features/orders/OrdersPage'), 'OrdersPage'), [P.LAB_ORDER_READ]),
      route('orders/new', lazyPage(() => import('@/features/orders/OrderBuilderPage'), 'OrderBuilderPage'), [P.LAB_ORDER_WRITE]),
      route('orders/:id', lazyPage(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage'), [P.LAB_ORDER_READ]),
      route('orders/:id/edit', lazyPage(() => import('@/features/orders/OrderBuilderPage'), 'OrderBuilderPage'), [P.LAB_ORDER_WRITE]),

      route('samples', lazyPage(() => import('@/features/samples/SamplesPage'), 'SamplesPage'), [P.SAMPLE_READ]),
      route('samples/:id', lazyPage(() => import('@/features/samples/SampleDetailPage'), 'SampleDetailPage'), [P.SAMPLE_READ]),
      route('samples/:id/label', lazyPage(() => import('@/features/samples/SampleLabelPage'), 'SampleLabelPage'), [P.SAMPLE_READ]),

      route('results', lazyPage(() => import('@/features/results/ResultsQueuePage'), 'ResultsQueuePage'), [P.RESULT_READ]),
      route('results/:id', lazyPage(() => import('@/features/results/ResultEntryPage'), 'ResultEntryPage'), [P.RESULT_READ]),

      route('qc', lazyPage(() => import('@/features/qc/QcPage'), 'QcPage'), [P.RESULT_READ]),

      route('reports', lazyPage(() => import('@/features/reports/ReportsPage'), 'ReportsPage'), [P.REPORT_READ]),
      route('reports/:id', lazyPage(() => import('@/features/reports/ReportViewPage'), 'ReportViewPage'), [P.REPORT_READ]),
      route('verify/:token', lazyPage(() => import('@/features/reports/VerifyReportPage'), 'VerifyReportPage'), [P.REPORT_READ]),

      route('invoices', lazyPage(() => import('@/features/billing/InvoicesPage'), 'InvoicesPage'), [P.INVOICE_READ]),
      route('invoices/:id', lazyPage(() => import('@/features/billing/InvoiceDetailPage'), 'InvoiceDetailPage'), [P.INVOICE_READ]),
      route('refunds', lazyPage(() => import('@/features/billing/RefundsPage'), 'RefundsPage'), [P.PAYMENT_READ]),

      route('ird', lazyPage(() => import('@/features/ird/IrdSubmissionsPage'), 'IrdSubmissionsPage'), [P.IRD_SUBMISSION_READ]),
      route('ird/:id', lazyPage(() => import('@/features/ird/IrdSubmissionDetailPage'), 'IrdSubmissionDetailPage'), [P.IRD_SUBMISSION_READ]),

      route('inventory', lazyPage(() => import('@/features/inventory/InventoryPage'), 'InventoryPage'), [P.INVENTORY_READ]),
      route('inventory/:id', lazyPage(() => import('@/features/inventory/InventoryItemDetailPage'), 'InventoryItemDetailPage'), [P.INVENTORY_READ]),
      route('suppliers', lazyPage(() => import('@/features/inventory/SuppliersPage'), 'SuppliersPage'), [P.INVENTORY_READ]),
      route('purchase-orders', lazyPage(() => import('@/features/inventory/PurchaseOrdersPage'), 'PurchaseOrdersPage'), [P.INVENTORY_READ]),
      route('purchase-orders/:id', lazyPage(() => import('@/features/inventory/PurchaseOrderDetailPage'), 'PurchaseOrderDetailPage'), [P.INVENTORY_READ]),

      route('users', lazyPage(() => import('@/features/admin/UsersPage'), 'UsersPage'), [P.USER_READ]),
      route('roles', lazyPage(() => import('@/features/admin/RolesPage'), 'RolesPage'), [P.ROLE_READ]),
      route('audit', lazyPage(() => import('@/features/admin/AuditPage'), 'AuditPage'), [P.AUDIT_READ]),
      route('analytics', lazyPage(() => import('@/features/analytics/AnalyticsPage'), 'AnalyticsPage'), [P.REPORTING_READ]),
      route('settings', lazyPage(() => import('@/features/settings/LaboratorySettingsPage'), 'LaboratorySettingsPage'), [P.SETTINGS_READ]),
      route('notifications', lazyPage(() => import('@/features/notifications/NotificationsPage'), 'NotificationsPage')),

      { path: 'forbidden', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
