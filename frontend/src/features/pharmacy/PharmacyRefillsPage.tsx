import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Plus,
  Search,
  ShoppingCart,
  User,
  Phone,
  Pill,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';
import { PharmacyHeader } from './PharmacyHeader';
import { pharmacyApi } from './api';
import type { RefillSchedule, RefillStats, CreateRefillScheduleRequest } from './types';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/toast';

export function PharmacyRefillsPage() {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();

  const [refills, setRefills] = useState<RefillSchedule[]>([]);
  const [stats, setStats] = useState<RefillStats>({
    totalScheduled: 0,
    overdue: 0,
    dueThisWeek: 0,
    remindersSent: 0,
    completedRefills: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sendingId, setSendingId] = useState<number | null>(null);

  // New Refill Schedule Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<CreateRefillScheduleRequest>>({
    patientName: '',
    patientPhone: '',
    itemName: '',
    courseDays: 30,
    dispensedQuantity: 30,
    unitType: 'TAB',
    dosageInstruction: '1 tab daily morning after food',
    notes: 'Chronic maintenance therapy',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [refillsData, statsData] = await Promise.all([
        pharmacyApi.refills.list({
          query: searchQuery || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        }),
        pharmacyApi.refills.stats(),
      ]);
      setRefills(refillsData.content || []);
      setStats(statsData);
    } catch {
      toast.error(t('Could not fetch chronic refill tracker data from server'));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendReminder = async (refill: RefillSchedule) => {
    setSendingId(refill.id);
    try {
      await pharmacyApi.refills.sendReminder(refill.id);
      toast.success(t('SMS sent to {phone} for {item}', { phone: refill.patientPhone, item: refill.itemName }));
      loadData();
    } catch {
      toast.error(t('Please check SMS gateway connection or patient phone number.'));
    } finally {
      setSendingId(null);
    }
  };

  const handleMarkRefilled = async (id: number) => {
    try {
      await pharmacyApi.refills.markRefilled(id);
      toast.success(t('Patient medication course updated successfully.'));
      loadData();
    } catch {
      toast.error(t('Update failed'));
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.patientPhone || !formData.itemName) {
      toast.error(t('Please enter Patient Name, Phone Number, and Medicine Name.'));
      return;
    }

    try {
      await pharmacyApi.refills.create({
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        itemId: 1, // default or linked
        itemName: formData.itemName,
        dispensedQuantity: formData.dispensedQuantity || 30,
        unitType: formData.unitType || 'TAB',
        dosageInstruction: formData.dosageInstruction,
        courseDays: formData.courseDays || 30,
        notes: formData.notes,
      });

      toast.success(t('Auto-reminder scheduled for {name}', { name: formData.patientName }));
      setShowCreateModal(false);
      loadData();
    } catch {
      toast.error(t('Failed to create refill schedule'));
    }
  };

  return (
    <div className="space-y-6">
      <PharmacyHeader />

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">{t('Total Scheduled')}</span>
            <CalendarClock className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.totalScheduled}</div>
          <p className="text-[11px] text-muted">{t('Active chronic regimens')}</p>
        </div>

        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('Due This Week')}</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-750 dark:text-amber-300">{stats.dueThisWeek}</div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">{t('Approaching medication end')}</p>
        </div>

        <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 shadow-xs dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex items-center justify-between text-red-700 dark:text-red-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('Overdue Refills')}</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-750 dark:text-red-300">{stats.overdue}</div>
          <p className="text-[11px] text-red-700/80 dark:text-red-400/80">{t('Missed refill date')}</p>
        </div>

        <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('Reminders Sent')}</span>
            <Send className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-750 dark:text-blue-300">{stats.remindersSent}</div>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80">{t('Automated SMS alerts')}</p>
        </div>

        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('Completed Refills')}</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-750 dark:text-emerald-300">{stats.completedRefills}</div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">{t('Patient adherence rate high')}</p>
        </div>
      </div>

      {/* Main Header and Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            {t('Chronic Patient Medication Refill Tracker')}
          </h2>
          <p className="text-xs text-muted">
            {t('Track long-term maintenance prescriptions (hypertension, diabetes, cardiac), send automated SMS reminders, and prevent patient adherence lapses.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('Refresh')}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('New Refill Schedule')}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <Input
            placeholder={t('Search by patient name, phone, or medicine...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: t('All Schedules') },
            { id: 'DUE_THIS_WEEK', label: t('Due This Week') },
            { id: 'OVERDUE', label: t('Overdue') },
            { id: 'REMINDER_SENT', label: t('SMS Sent') },
            { id: 'REFILLED', label: t('Refilled') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface-muted text-muted-foreground hover:bg-surface-muted/80 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Refills Table */}
      <div className="rounded-xl border border-border/80 bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/70 text-muted-foreground font-semibold border-b border-border/80">
              <tr>
                <th className="px-4 py-3">{t('Patient')}</th>
                <th className="px-4 py-3">{t('Medicine & Dosage')}</th>
                <th className="px-4 py-3">{t('Refill Due Date')}</th>
                <th className="px-4 py-3">{t('Status')}</th>
                <th className="px-4 py-3">{t('SMS Reminders')}</th>
                <th className="px-4 py-3 text-right">{t('Adherence Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                    {t('Loading refill schedules...')}
                  </td>
                </tr>
              ) : refills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <CalendarClock className="mx-auto h-10 w-10 text-muted/40 mb-2" />
                    <p className="font-semibold text-foreground text-sm">{t('No refill schedules found')}</p>
                    <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                      {t('When dispensing chronic medications (Blood pressure, Diabetes, Thyroid) at the POS counter, enable "Schedule Refill Reminder" to automate adherence alerts.')}
                    </p>
                  </td>
                </tr>
              ) : (
                refills.map((refill) => {
                  return (
                    <tr key={refill.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted" />
                          {refill.patientName}
                        </div>
                        <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {refill.patientPhone}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5 text-primary" />
                          {refill.itemName}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {refill.dispensedQuantity} {refill.unitType} ({refill.courseDays} days) • {refill.dosageInstruction || 'Standard regimen'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {new Date(refill.refillDueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        {refill.isOverdue && refill.status !== 'REFILLED' ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {t('Overdue')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted">
                            {refill.courseDays} {t('day course')}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {refill.status === 'REFILLED' && (
                          <Badge tone="success" variant="subtle">
                            <Check className="h-3 w-3 mr-1 inline" />
                            {t('Refilled')}
                          </Badge>
                        )}
                        {refill.status === 'REMINDER_SENT' && (
                          <Badge tone="info" variant="subtle">
                            <Send className="h-3 w-3 mr-1 inline" />
                            {t('SMS Alerted')}
                          </Badge>
                        )}
                        {refill.status === 'SCHEDULED' && !refill.isOverdue && (
                          <Badge tone="neutral" variant="subtle">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            {t('Scheduled')}
                          </Badge>
                        )}
                        {refill.status === 'SCHEDULED' && refill.isOverdue && (
                          <Badge tone="danger" variant="subtle">
                            <AlertCircle className="h-3 w-3 mr-1 inline" />
                            {t('Overdue')}
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-foreground">
                          {refill.reminderCount} {t('sent')}
                        </div>
                        {refill.lastReminderSentAt && (
                          <div className="text-[10px] text-muted">
                            {new Date(refill.lastReminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {refill.status !== 'REFILLED' && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-[11px] gap-1 border-primary/40 text-primary hover:bg-primary/10"
                                disabled={sendingId === refill.id}
                                onClick={() => handleSendReminder(refill)}
                              >
                                {sendingId === refill.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                {t('Send SMS')}
                              </Button>

                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-[11px] gap-1 border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                onClick={() => handleMarkRefilled(refill.id)}
                              >
                                <Check className="h-3 w-3" />
                                {t('Mark Refilled')}
                              </Button>

                              <Button
                                size="sm"
                                className="h-7 text-[11px] gap-1"
                                onClick={() => navigate(`/app/pharmacy/pos?search=${encodeURIComponent(refill.itemName)}`)}
                              >
                                <ShoppingCart className="h-3 w-3" />
                                {t('Dispense')}
                              </Button>
                            </>
                          )}
                          {refill.status === 'REFILLED' && (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              {t('Adherence completed')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Refill Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{t('Schedule Chronic Medication Refill')}</h3>
                  <p className="text-xs text-muted">{t('Automate SMS refill reminders for chronic disease maintenance')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('Patient Full Name *')}</label>
                  <Input
                    required
                    placeholder="e.g. Ram Bahadur Thapa"
                    value={formData.patientName || ''}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('Patient Phone Number *')}</label>
                  <Input
                    required
                    placeholder="e.g. 9801234567"
                    value={formData.patientPhone || ''}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">{t('Medicine / Drug Name *')}</label>
                <Input
                  required
                  placeholder="e.g. Amlodipine 5mg / Metformin 500mg"
                  value={formData.itemName || ''}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('Course Days *')}</label>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={formData.courseDays || 30}
                    onChange={(e) => setFormData({ ...formData, courseDays: parseInt(e.target.value) || 30 })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('Quantity Dispensed')}</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.dispensedQuantity || 30}
                    onChange={(e) => setFormData({ ...formData, dispensedQuantity: parseInt(e.target.value) || 30 })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('Unit Type')}</label>
                  <Input
                    value={formData.unitType || 'TAB'}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">{t('Dosage & Instructions')}</label>
                <Input
                  placeholder="e.g. 1 tablet once daily morning after meals"
                  value={formData.dosageInstruction || ''}
                  onChange={(e) => setFormData({ ...formData, dosageInstruction: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">{t('Clinical Notes')}</label>
                <Input
                  placeholder="e.g. Hypertension maintenance, target BP < 130/80"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  {t('The system will automatically schedule a tailored SMS reminder 2 days before the prescription finishes to ensure zero missed doses.')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" size="sm">
                  {t('Schedule Refill & SMS')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default PharmacyRefillsPage;
