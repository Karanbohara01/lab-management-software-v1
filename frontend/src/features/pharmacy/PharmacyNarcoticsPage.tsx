import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { NarcoticLog } from './types';
import { PharmacyHeader } from './PharmacyHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import {
  ShieldAlert,
  Search,
  Plus,
  Printer,
  FileCheck2,
  User,
  Stethoscope,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export function PharmacyNarcoticsPage() {
  const t = useT();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NarcoticLog | null>(null);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [patientName, setPatientName] = useState('');
  const [patientAgeGender, setPatientAgeGender] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerRelation, setBuyerRelation] = useState('SELF');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerIdType, setBuyerIdType] = useState('CITIZENSHIP');
  const [buyerIdNumber, setBuyerIdNumber] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorNmcNumber, setDoctorNmcNumber] = useState('');
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [dispensedQuantity, setDispensedQuantity] = useState(1);
  const [pharmacistName, setPharmacistName] = useState('Senior Registered Pharmacist');
  const [pharmacistNpcNumber, setPharmacistNpcNumber] = useState('NPC-7842');
  const [remarks, setRemarks] = useState('');

  // Queries
  const { data: logsPage, refetch } = useQuery(
    () => pharmacyApi.narcotics.list({ query: search, size: 50 }),
    [search]
  );

  const { data: itemsPage } = useQuery(() => pharmacyApi.items.list({ size: 100 }), []);
  const { data: batches } = useQuery(() => pharmacyApi.batches.list(), []);

  // Filter batches for selected item
  const availableBatches = (batches || []).filter(
    (b) => selectedItemId && b.itemId === Number(selectedItemId) && b.remainingUnits > 0
  );

  // Handle Form Submit
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !selectedBatchId) {
      toast.error(t('Please select medicine item and active batch'));
      return;
    }
    if (!patientName.trim() || !buyerName.trim()) {
      toast.error(t('Patient and buyer names are mandatory'));
      return;
    }
    if (!doctorName.trim() || !doctorNmcNumber.trim()) {
      toast.error(t('Doctor name and NMC Registration Number are mandatory by DDA'));
      return;
    }

    try {
      setIsSubmitting(true);
      await pharmacyApi.narcotics.record({
        itemId: Number(selectedItemId),
        batchId: Number(selectedBatchId),
        patientName,
        patientAgeGender,
        patientAddress,
        buyerName,
        buyerRelation,
        buyerContact,
        buyerIdType,
        buyerIdNumber,
        doctorName,
        doctorNmcNumber,
        prescriptionNumber,
        prescriptionDate: prescriptionDate || undefined,
        dispensedQuantity,
        pharmacistName,
        pharmacistNpcNumber,
        remarks,
      });

      toast.success(t('Controlled drug dispensing logged in official register'));
      setIsModalOpen(false);
      // Reset form
      setPatientName('');
      setBuyerName('');
      setBuyerIdNumber('');
      setDoctorName('');
      setDoctorNmcNumber('');
      setPrescriptionNumber('');
      setSelectedItemId('');
      setSelectedBatchId('');
      setDispensedQuantity(1);
      refetch();
    } catch {
      toast.error(t('Failed to record narcotic log. Check all required fields.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PharmacyHeader />

      {/* Hero Banner & KPI Summary */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50/50 p-5 shadow-xs dark:border-red-950/60 dark:bg-red-950/20"
        data-print-hide
      >
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-red-900 dark:text-red-200">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            {t('Narcotics & Schedule H Drug Register (लागु तथा मनोद्विपक औषधि अभिलेख)')}
          </h2>
          <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/70">
            {t('Department of Drug Administration (DDA Nepal) mandatory audit log: Patient ID, Buyer KYC, Doctor NMC No., and batch balance tracking.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-200"
          >
            <Printer className="mr-2 h-4 w-4" />
            {t('Print DDA Register')}
          </Button>

          <Button
            className="bg-red-600 text-white hover:bg-red-700 shadow-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('Record Controlled Dispense')}
          </Button>
        </div>
      </div>

      {/* Search and Audit Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs"
        data-print-hide
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <Input
            placeholder={t('Search by patient, buyer, doctor, NMC No, or prescription...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <FileCheck2 className="h-4 w-4 text-emerald-600" />
          <span>{t('Strict DDA compliance: retained for 3 years')}: </span>
          <strong className="text-foreground">{logsPage?.totalElements || 0} {t('Entries')}</strong>
        </div>
      </div>

      {/* Main Controlled Drug Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50/80 text-muted dark:bg-gray-800/60 font-semibold">
                <th className="py-3 px-3.5">{t('Date & Time')}</th>
                <th className="py-3 px-3.5">{t('Controlled Drug & Batch')}</th>
                <th className="py-3 px-3.5">{t('Patient Name & Address')}</th>
                <th className="py-3 px-3.5">{t('Buyer Details & ID Proof')}</th>
                <th className="py-3 px-3.5">{t('Prescribing Doctor (NMC)')}</th>
                <th className="py-3 px-3.5 text-center">{t('Qty')}</th>
                <th className="py-3 px-3.5 text-center">{t('Balance Units')}</th>
                <th className="py-3 px-3.5">{t('Pharmacist (NPC)')}</th>
                <th className="py-3 px-3.5 text-right" data-print-hide>{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logsPage?.content && logsPage.content.length > 0 ? (
                logsPage.content.map((log) => (
                  <tr key={log.id} className="hover:bg-red-50/20 transition dark:hover:bg-red-950/10">
                    <td className="py-3 px-3.5 whitespace-nowrap text-muted">
                      <div className="font-medium text-foreground">{new Date(log.logDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(log.logDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-red-700 dark:text-red-400">{log.itemName}</div>
                      <div className="text-[10px] text-muted">
                        Batch: <span className="font-mono font-semibold">{log.batchNumber}</span>
                        {log.expiryDate && ` · Exp: ${log.expiryDate}`}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-foreground">{log.patientName}</div>
                      {log.patientAgeGender && <div className="text-[10px] text-muted">{log.patientAgeGender}</div>}
                      {log.patientAddress && <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{log.patientAddress}</div>}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-foreground">{log.buyerName} ({log.buyerRelation || 'SELF'})</div>
                      <div className="text-[10px] text-muted">
                        {log.buyerIdType}: <span className="font-mono">{log.buyerIdNumber || 'N/A'}</span>
                      </div>
                      {log.buyerContact && <div className="text-[10px] text-gray-400">{log.buyerContact}</div>}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <Stethoscope className="h-3 w-3 text-primary-500" />
                        <span>{log.doctorName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        NMC: {log.doctorNmcNumber}
                      </div>
                      {log.prescriptionNumber && (
                        <div className="text-[10px] text-gray-400">Rx: {log.prescriptionNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold text-red-600">
                      {log.dispensedQuantity} {log.unitType}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-foreground">
                      <Badge tone={log.balanceStockUnits < 10 ? 'warning' : 'neutral'}>
                        {log.balanceStockUnits} {log.unitType}
                      </Badge>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-foreground">{log.pharmacistName}</div>
                      {log.pharmacistNpcNumber && (
                        <div className="text-[10px] text-muted">NPC: {log.pharmacistNpcNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right" data-print-hide>
                      <Button
                        variant="secondary"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setSelectedLog(log)}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {t('Slip')}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    <ShieldAlert className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="font-semibold text-sm">{t('No narcotic logs recorded')}</p>
                    <p className="text-xs text-gray-400">
                      {t('All Schedule H and narcotic drug dispensations will strictly log here.')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Controlled Dispense Modal */}
      {isModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsModalOpen(false)}
          title={t('Record Controlled / Narcotic Drug Dispense (अनुसूची अभिलेख)')}
          size="lg"
        >
          <form onSubmit={handleSaveLog} className="space-y-4 p-2 text-xs">
            {/* Section 1: Drug & Batch Selection */}
            <div className="rounded-lg border border-red-200 bg-red-50/40 p-3 space-y-3 dark:border-red-950/40 dark:bg-red-950/10">
              <h4 className="font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                {t('1. Controlled Substance & Batch')}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-muted block mb-1 font-semibold">{t('Select Controlled Medicine *')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs font-semibold"
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(e.target.value ? Number(e.target.value) : '');
                      setSelectedBatchId('');
                    }}
                    required
                  >
                    <option value="">{t('-- Choose Narcotic / Schedule H Drug --')}</option>
                    {itemsPage?.content?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.genericName || 'No Generic'}) — Schedule: {item.schedule || 'H'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1 font-semibold">{t('Available Batch (FEFO) *')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : '')}
                    required
                    disabled={!selectedItemId}
                  >
                    <option value="">{t('-- Select Stock Batch --')}</option>
                    {availableBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        Batch: {b.batchNumber} | Exp: {b.expiryDate} | Avail: {b.remainingUnits} units
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-32">
                <label className="text-muted block mb-1 font-semibold">{t('Dispensed Quantity *')}</label>
                <Input
                  type="number"
                  min={1}
                  value={dispensedQuantity}
                  onChange={(e) => setDispensedQuantity(parseInt(e.target.value) || 1)}
                  className="font-bold"
                  required
                />
              </div>
            </div>

            {/* Section 2: Patient & Buyer KYC */}
            <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary-500" />
                {t('2. Patient & Buyer KYC Identification (DDA Req)')}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-muted block mb-1">{t('Patient Full Name *')}</label>
                  <Input
                    placeholder="e.g. Ramesh Thapa"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Age / Gender')}</label>
                  <Input
                    placeholder="e.g. 45Y / Male"
                    value={patientAgeGender}
                    onChange={(e) => setPatientAgeGender(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Patient Address')}</label>
                  <Input
                    placeholder="e.g. Balaju, Kathmandu"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-muted block mb-1">{t('Buyer / Receiver Name *')}</label>
                  <Input
                    placeholder="e.g. Sunita Thapa"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Relation to Patient')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    value={buyerRelation}
                    onChange={(e) => setBuyerRelation(e.target.value)}
                  >
                    <option value="SELF">Self (Patient)</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="PARENT">Parent</option>
                    <option value="CHILD">Child / Sibling</option>
                    <option value="ATTENDANT">Hospital Attendant</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Photo ID Type')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    value={buyerIdType}
                    onChange={(e) => setBuyerIdType(e.target.value)}
                  >
                    <option value="CITIZENSHIP">Citizenship No.</option>
                    <option value="NATIONAL_ID">National ID (NID)</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Buyer ID / Contact')}</label>
                  <Input
                    placeholder="ID No. or Mobile"
                    value={buyerIdNumber}
                    onChange={(e) => {
                      setBuyerIdNumber(e.target.value);
                      setBuyerContact(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Prescribing Doctor & NMC Verification */}
            <div className="rounded-lg border border-border bg-surface p-3 space-y-3">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-emerald-600" />
                {t('3. Doctor Prescription & NMC Verification')}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-muted block mb-1">{t('Doctor Full Name *')}</label>
                  <Input
                    placeholder="e.g. Dr. Bikash Sharma"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Doctor NMC Reg No. *')}</label>
                  <Input
                    placeholder="e.g. NMC-14522"
                    value={doctorNmcNumber}
                    onChange={(e) => setDoctorNmcNumber(e.target.value)}
                    className="font-mono font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Prescription Slip No.')}</label>
                  <Input
                    placeholder="e.g. RX-2026-904"
                    value={prescriptionNumber}
                    onChange={(e) => setPrescriptionNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Prescription Date')}</label>
                  <Input
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-border">
                <div>
                  <label className="text-muted block mb-1">{t('Dispensing Pharmacist Name')}</label>
                  <Input
                    value={pharmacistName}
                    onChange={(e) => setPharmacistName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">{t('Pharmacist NPC Reg No.')}</label>
                  <Input
                    value={pharmacistNpcNumber}
                    onChange={(e) => setPharmacistNpcNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">{t('Clinical / DDA Remarks')}</label>
                <Input
                  placeholder="Optional indication (e.g. Post-operative acute pain management)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setIsModalOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-600 text-white hover:bg-red-700 shadow-sm"
                loading={isSubmitting}
              >
                {t('Sign & Commit to Official Register')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Slip Modal View */}
      {selectedLog && (
        <Modal
          open={true}
          onClose={() => setSelectedLog(null)}
          title={t('Controlled Drug Dispense Certificate')}
          size="md"
        >
          <div className="space-y-4 p-4 font-mono text-xs border rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white">
            <div className="border-b pb-2 text-center">
              <h3 className="font-bold text-sm">HOSPITAL PHARMACY NARCOTIC RECORD</h3>
              <p className="text-[10px] text-gray-500">Under Drug Act 2035 & DDA Regulations</p>
            </div>

            <div className="space-y-1 text-xs">
              <div><strong>Drug:</strong> {selectedLog.itemName} ({selectedLog.genericName || 'N/A'})</div>
              <div><strong>Batch:</strong> {selectedLog.batchNumber} (Bal: {selectedLog.balanceStockUnits})</div>
              <div><strong>Dispensed:</strong> {selectedLog.dispensedQuantity} {selectedLog.unitType}</div>
              <div><strong>Patient:</strong> {selectedLog.patientName}</div>
              <div><strong>Buyer / KYC:</strong> {selectedLog.buyerName} ({selectedLog.buyerIdType}: {selectedLog.buyerIdNumber})</div>
              <div><strong>Prescribed By:</strong> {selectedLog.doctorName} (NMC: {selectedLog.doctorNmcNumber})</div>
              <div><strong>Dispensing Pharmacist:</strong> {selectedLog.pharmacistName} (NPC: {selectedLog.pharmacistNpcNumber || 'N/A'})</div>
            </div>

            <div className="flex gap-2 pt-2" data-print-hide>
              <Button variant="secondary" className="flex-1" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Slip')}
              </Button>
              <Button className="flex-1" onClick={() => setSelectedLog(null)}>
                {t('Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PharmacyNarcoticsPage;
