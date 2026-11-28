import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { Prescription } from './types';
import { PharmacyHeader } from './PharmacyHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useT } from '@/i18n';
import {
  ClipboardList,
  Search,
  ShoppingCart,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';

export function PharmacyPrescriptionsPage() {
  const t = useT();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for creating new Prescription
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorNmc, setDoctorNmc] = useState('');
  const [department, setDepartment] = useState('Outpatient OPD');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    {
      itemId: number;
      dosage: string;
      frequency: string;
      durationDays: number;
      quantityPrescribed: number;
      unitType: 'PACK' | 'UNIT';
      instructions: string;
    }[]
  >([]);

  // Load available catalog medicines for prescription picker
  const { data: medicinesPage } = useQuery(() => pharmacyApi.items.list({ size: 200 }), []);

  // Temporary row state for adding items to the form
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [tempDosage, setTempDosage] = useState('1 Tab BD');
  const [tempFrequency, setTempFrequency] = useState('1-0-1');
  const [tempDuration, setTempDuration] = useState(5);
  const [tempQty, setTempQty] = useState(10);
  const [tempUnitType, setTempUnitType] = useState<'PACK' | 'UNIT'>('UNIT');
  const [tempInstructions, setTempInstructions] = useState('After meals');

  // Load Prescriptions List
  const {
    data: prescriptionsPage,
    loading,
    refetch,
  } = useQuery(
    () =>
      pharmacyApi.prescriptions.list({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        query: search || undefined,
        size: 50,
      }),
    [selectedStatus, search]
  );

  const prescriptions = prescriptionsPage?.content || [];

  // KPI telemetry
  const totalPrescriptions = prescriptions.length;
  const pendingCount = prescriptions.filter((p) => p.status === 'PENDING').length;
  const partialCount = prescriptions.filter((p) => p.status === 'PARTIALLY_DISPENSED').length;
  const completedCount = prescriptions.filter((p) => p.status === 'COMPLETED').length;

  const handleAddItemToPrescription = () => {
    if (!selectedItemId) return;
    setItems((prev) => [
      ...prev,
      {
        itemId: Number(selectedItemId),
        dosage: tempDosage,
        frequency: tempFrequency,
        durationDays: tempDuration,
        quantityPrescribed: tempQty,
        unitType: tempUnitType,
        instructions: tempInstructions,
      },
    ]);
    setSelectedItemId('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert(t('Please enter patient name.'));
      return;
    }
    if (!doctorName.trim()) {
      alert(t('Please enter prescriber doctor name.'));
      return;
    }
    if (items.length === 0) {
      alert(t('Please add at least one medication to the prescription.'));
      return;
    }

    try {
      setIsSubmitting(true);
      await pharmacyApi.prescriptions.create({
        patientName,
        patientPhone: patientPhone || undefined,
        patientMrn: patientMrn || undefined,
        doctorName,
        doctorNmc: doctorNmc || undefined,
        department,
        diagnosis: diagnosis || undefined,
        notes: notes || undefined,
        items,
      });

      setIsCreateModalOpen(false);
      // Reset form
      setPatientName('');
      setPatientPhone('');
      setPatientMrn('');
      setDoctorName('');
      setDoctorNmc('');
      setDiagnosis('');
      setNotes('');
      setItems([]);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || t('Failed to create prescription.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Prescription['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            {t('Pending Dispense')}
          </span>
        );
      case 'PARTIALLY_DISPENSED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <AlertCircle className="h-3 w-3" />
            {t('Partially Dispensed')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            {t('Completed / Dispensed')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-[11px] font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {t('Cancelled')}
          </span>
        );
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Banner Navigation Header */}
      <PharmacyHeader />

      {/* Page Title & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <ClipboardList className="h-6 w-6 text-primary" />
            {t('Doctor E-Prescriptions & Clinical Notes')}
          </h2>
          <p className="text-xs text-muted">
            {t('Receive outpatient doctor prescriptions, audit clinical drug orders, and dispense in 1-click at POS')}
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-sm font-semibold">
          <Plus className="h-4 w-4" />
          {t('Issue New E-Prescription')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs font-medium text-muted">{t('Total Prescriptions')}</span>
          <div className="mt-1 text-2xl font-black text-foreground">{totalPrescriptions}</div>
        </div>

        <div className="rounded-xl border border-amber-300/60 bg-amber-50/40 p-4 shadow-xs dark:bg-amber-950/20">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
            {t('Pending Dispense at POS')}
          </span>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-400">{pendingCount}</div>
        </div>

        <div className="rounded-xl border border-blue-300/60 bg-blue-50/40 p-4 shadow-xs dark:bg-blue-950/20">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
            {t('Partially Dispensed')}
          </span>
          <div className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-400">{partialCount}</div>
        </div>

        <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/40 p-4 shadow-xs dark:bg-emerald-950/20">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {t('Completed Dispensing')}
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">{completedCount}</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 shadow-xs">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <Input
            placeholder={t('Search by Rx #, patient name, MRN, phone, doctor, or diagnosis...')}
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted/50 p-1 text-xs">
          {(['ALL', 'PENDING', 'PARTIALLY_DISPENSED', 'COMPLETED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                selectedStatus === status
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {status === 'ALL'
                ? t('All Rx')
                : status === 'PENDING'
                  ? t('Pending')
                  : status === 'PARTIALLY_DISPENSED'
                    ? t('Partial')
                    : t('Completed')}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-muted/60 text-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">{t('Rx Number & Date')}</th>
                <th className="py-3 px-4">{t('Patient Information')}</th>
                <th className="py-3 px-4">{t('Doctor Prescriber')}</th>
                <th className="py-3 px-4">{t('Diagnosis / Dept')}</th>
                <th className="py-3 px-4">{t('Prescribed Medications')}</th>
                <th className="py-3 px-4">{t('Dispense Status')}</th>
                <th className="py-3 px-4 text-right">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    {t('Loading electronic prescriptions...')}
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <ClipboardList className="mx-auto h-8 w-8 text-muted/40 mb-2" />
                    <p className="font-semibold text-foreground">{t('No E-Prescriptions found')}</p>
                    <p className="text-xs">{t('Click "Issue New E-Prescription" to create one or adjust your filters.')}</p>
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-primary">{rx.prescriptionNumber}</div>
                      <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(rx.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted" />
                        {rx.patientName}
                      </div>
                      <div className="text-[11px] text-muted">
                        {rx.patientMrn && <span className="font-mono mr-2">MRN: {rx.patientMrn}</span>}
                        {rx.patientPhone && <span>Tel: {rx.patientPhone}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-muted" />
                        {rx.doctorName}
                      </div>
                      {rx.doctorNmc && (
                        <div className="text-[11px] text-muted font-mono">NMC: {rx.doctorNmc}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{rx.diagnosis || 'General Clinical'}</div>
                      <div className="text-[11px] text-muted">{rx.department || 'OPD'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {rx.items.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                          >
                            {item.itemName} ({item.quantityPrescribed} {item.unitType})
                          </span>
                        ))}
                        {rx.items.length > 3 && (
                          <span className="text-[10px] text-muted font-bold">
                            +{rx.items.length - 3} {t('more')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(rx.status)}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rx.status !== 'COMPLETED' && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2.5 text-xs font-semibold shadow-xs"
                            onClick={() => navigate(`/app/pharmacy/pos?rx=${encodeURIComponent(rx.prescriptionNumber)}`)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            {t('Dispense')}
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => setActivePrescription(rx)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {t('View Rx')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prescription Detail & Print Modal */}
      {activePrescription && (
        <Modal
          open={true}
          onClose={() => setActivePrescription(null)}
          title={t('E-Prescription #{num}', { num: activePrescription.prescriptionNumber })}
          size="lg"
        >
          <div className="space-y-4">
            <div className="max-h-[72vh] overflow-y-auto rounded-xl border border-border/80 bg-white p-6 text-gray-950 font-sans shadow-sm [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              {/* Header Letterhead */}
              <div className="border-b-2 border-primary pb-3 flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-primary tracking-wide uppercase">
                    LIMS CLINICAL HOSPITAL & RESEARCH CENTER
                  </h3>
                  <p className="text-xs text-gray-600">Hospital Road, Kathmandu, Nepal · Tel: 01-4455660</p>
                  <p className="text-xs font-semibold text-gray-800">Department: {activePrescription.department}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-red-700 font-mono">
                    Rx #: {activePrescription.prescriptionNumber}
                  </div>
                  <div className="text-xs text-gray-600">
                    Date: {new Date(activePrescription.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-1">{getStatusBadge(activePrescription.status)}</div>
                </div>
              </div>

              {/* Patient & Doctor Meta */}
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 py-3 text-xs">
                <div>
                  <div className="text-gray-500 font-semibold">{t('Patient Details')}:</div>
                  <div className="font-black text-gray-900 text-sm">{activePrescription.patientName}</div>
                  {activePrescription.patientMrn && <div>MRN: <span className="font-mono">{activePrescription.patientMrn}</span></div>}
                  {activePrescription.patientPhone && <div>Phone: {activePrescription.patientPhone}</div>}
                </div>
                <div>
                  <div className="text-gray-500 font-semibold">{t('Prescribing Physician')}:</div>
                  <div className="font-bold text-gray-900">{activePrescription.doctorName}</div>
                  {activePrescription.doctorNmc && <div>NMC Reg: <span className="font-mono">{activePrescription.doctorNmc}</span></div>}
                  {activePrescription.diagnosis && <div>Diagnosis: <span className="font-semibold text-gray-800">{activePrescription.diagnosis}</span></div>}
                </div>
              </div>

              {/* Medications Table */}
              <div className="py-4">
                <div className="text-sm font-black text-primary flex items-center gap-1 mb-2">
                  <span className="text-xl font-serif">℞</span> {t('Prescribed Medicines')}
                </div>
                <table className="w-full text-left text-xs border border-gray-200">
                  <thead className="bg-gray-100 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">{t('Medicine & Generic')}</th>
                      <th className="p-2">{t('Dosage')}</th>
                      <th className="p-2">{t('Frequency')}</th>
                      <th className="p-2 text-center">{t('Duration')}</th>
                      <th className="p-2 text-center">{t('Qty')}</th>
                      <th className="p-2">{t('Instructions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activePrescription.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 text-gray-500">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-bold text-gray-900">{item.itemName}</div>
                          {item.genericName && <div className="text-[10px] text-gray-500 italic">{item.genericName}</div>}
                        </td>
                        <td className="p-2 font-medium">{item.dosage}</td>
                        <td className="p-2 font-mono">{item.frequency || 'N/A'}</td>
                        <td className="p-2 text-center">{item.durationDays} days</td>
                        <td className="p-2 text-center font-bold">
                          {item.quantityPrescribed} {item.unitType}
                        </td>
                        <td className="p-2 text-gray-700 italic">{item.instructions || 'As advised'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Doctor Sign */}
              <div className="pt-8 flex justify-between items-end text-xs">
                <div className="text-gray-500 text-[10px]">
                  Generated via LIMS Clinical EHR & E-Prescription Suite
                </div>
                <div className="text-center">
                  <div className="w-40 border-t border-gray-900 pt-1 font-bold">{activePrescription.doctorName}</div>
                  <div className="text-[10px] text-gray-500">Authorized Doctor Signature</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-1">
              {activePrescription.status !== 'COMPLETED' && (
                <Button
                  className="flex-1 py-2 text-xs font-semibold"
                  onClick={() => {
                    navigate(`/app/pharmacy/pos?rx=${encodeURIComponent(activePrescription.prescriptionNumber)}`);
                  }}
                >
                  <ShoppingCart className="mr-1.5 h-4 w-4" />
                  {t('Dispense at POS Counter')}
                </Button>
              )}
              <Button variant="secondary" className="flex-1 py-2 text-xs font-semibold" onClick={() => window.print()}>
                <Printer className="mr-1.5 h-4 w-4" />
                {t('Print Rx Slip')}
              </Button>
              <Button variant="secondary" className="py-2 text-xs" onClick={() => setActivePrescription(null)}>
                {t('Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Issue New E-Prescription */}
      {isCreateModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsCreateModalOpen(false)}
          title={t('Issue New E-Prescription')}
          size="lg"
        >
          <form onSubmit={handleCreatePrescription} className="space-y-4 text-xs">
            {/* Patient & Doctor Form Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-border bg-surface-muted/30 p-3">
              <div>
                <label className="text-muted block mb-1 font-semibold">{t('Patient Full Name *')}</label>
                <Input
                  required
                  placeholder="e.g. Ramesh Thapa"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-semibold">{t('Patient Phone / MRN')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Mobile 98xxxxxxxx"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="MRN #"
                    value={patientMrn}
                    onChange={(e) => setPatientMrn(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1 font-semibold">{t('Prescribing Doctor Name *')}</label>
                <Input
                  required
                  placeholder="e.g. Dr. Rajesh Shrestha"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-muted block mb-1 font-semibold">{t('Doctor NMC Reg & Dept')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="NMC-18292"
                    value={doctorNmc}
                    onChange={(e) => setDoctorNmc(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-muted block mb-1 font-semibold">{t('Diagnosis / Clinical Summary')}</label>
                <Input
                  placeholder="e.g. Acute upper respiratory infection, mild hypertension"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Medication Items Adder */}
            <div className="rounded-lg border border-dashed border-border p-3 space-y-3 bg-surface-muted/20">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-primary" />
                {t('Add Medicine to Prescription')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <label className="text-muted block mb-1 font-semibold">{t('Select Drug')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">{t('-- Choose Medication --')}</option>
                    {(medicinesPage?.content || []).map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} ({med.genericName || 'No Generic'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-muted block mb-1 font-semibold">{t('Dosage')}</label>
                  <Input
                    value={tempDosage}
                    onChange={(e) => setTempDosage(e.target.value)}
                    className="text-xs"
                    placeholder="1 Tab"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-muted block mb-1 font-semibold">{t('Frequency')}</label>
                  <Input
                    value={tempFrequency}
                    onChange={(e) => setTempFrequency(e.target.value)}
                    className="text-xs"
                    placeholder="1-0-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-muted block mb-1 font-semibold">{t('Duration (d)')}</label>
                  <Input
                    type="number"
                    min={1}
                    value={tempDuration}
                    onChange={(e) => setTempDuration(parseInt(e.target.value) || 1)}
                    className="text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-muted block mb-1 font-semibold">{t('Qty & Unit')}</label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={tempQty}
                      onChange={(e) => setTempQty(parseInt(e.target.value) || 1)}
                      className="text-xs w-14"
                    />
                    <select
                      className="rounded-md border border-border bg-surface p-1 text-[11px]"
                      value={tempUnitType}
                      onChange={(e: any) => setTempUnitType(e.target.value)}
                    >
                      <option value="UNIT">Tab</option>
                      <option value="PACK">Pack</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-9">
                  <label className="text-muted block mb-1 font-semibold">{t('Instructions')}</label>
                  <Input
                    value={tempInstructions}
                    onChange={(e) => setTempInstructions(e.target.value)}
                    className="text-xs"
                    placeholder="After meals, with warm water"
                  />
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full text-xs font-semibold"
                    onClick={handleAddItemToPrescription}
                    disabled={!selectedItemId}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {t('Add Drug')}
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="rounded border border-border bg-surface overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-muted border-b border-border text-muted">
                      <tr>
                        <th className="p-2">{t('Drug')}</th>
                        <th className="p-2">{t('Dosage')}</th>
                        <th className="p-2">{t('Freq')}</th>
                        <th className="p-2">{t('Days')}</th>
                        <th className="p-2">{t('Qty')}</th>
                        <th className="p-2">{t('Instructions')}</th>
                        <th className="p-2 text-right">{t('Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((it, idx) => {
                        const med = (medicinesPage?.content || []).find((m) => m.id === it.itemId);
                        return (
                          <tr key={idx}>
                            <td className="p-2 font-bold">{med ? med.name : `Item #${it.itemId}`}</td>
                            <td className="p-2">{it.dosage}</td>
                            <td className="p-2 font-mono">{it.frequency}</td>
                            <td className="p-2">{it.durationDays}d</td>
                            <td className="p-2 font-bold">
                              {it.quantityPrescribed} {it.unitType}
                            </td>
                            <td className="p-2 text-muted italic">{it.instructions}</td>
                            <td className="p-2 text-right">
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || items.length === 0} className="font-semibold">
                {isSubmitting ? t('Submitting...') : t('Save & Issue E-Prescription')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PharmacyPrescriptionsPage;
