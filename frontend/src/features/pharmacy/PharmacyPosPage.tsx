import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import { doctorsApi } from '@/features/doctors/api';
import type { PharmacyItem, SaleReceipt, DispenseItemRequest, Prescription, DrugSafetyCheckResponse } from './types';
import type { PatientListItem } from '@/features/patients/types';
import { PatientPicker } from '@/features/patients/PatientPicker';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import {
  Search,
  ShoppingCart,
  Trash2,
  Printer,
  Pill,
  Plus,
  Minus,
  User,
  Stethoscope,
  RotateCcw,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  Clock,
  MapPin,
  ClipboardList,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Scan,
  Volume2,
  VolumeX,
  PauseCircle,
  PlayCircle,
  Zap,
} from 'lucide-react';
import { PharmacyHeader } from './PharmacyHeader';
import { PharmacyReceiptPrint } from './PharmacyReceiptPrint';
import { playScanSuccessSound, playScanErrorSound, playCheckoutDingSound } from './posAudio';

interface HeldCart {
  id: string;
  heldAt: string;
  customerName: string;
  customerPhone?: string;
  selectedPatientId?: number;
  doctorName: string;
  paymentMethod: 'CASH' | 'QR_FONEPAY' | 'CARD' | 'CREDIT';
  cart: CartLine[];
  subtotal: number;
  grandTotal: number;
}

interface CartLine {
  item: PharmacyItem;
  unitType: 'PACK' | 'UNIT';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosageInstruction: string;
}

const DOSAGE_PRESETS = [
  '1-0-1 After Food',
  '1-1-1 After Food',
  '1-0-0 Before Food',
  '0-0-1 At Bedtime',
  'SOS (As Needed)',
  'Apply Twice Daily',
];

export function PharmacyPosPage() {
  const t = useT();
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Load items
  const { data: itemsPage, loading: itemsLoading, refetch: refetchItems } = useQuery(
    () => pharmacyApi.items.list({ query: search, size: 60 }),
    [search]
  );

  // Load doctors for prescription attribution
  const { data: doctorsData } = useQuery(
    () => doctorsApi.list({ activeOnly: true, size: 100 }),
    []
  );

  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(undefined);
  const [doctorName, setDoctorName] = useState('');
  const [activeRxNumber, setActiveRxNumber] = useState<string | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  // Load pending prescriptions for the quick pull modal
  const { data: pendingRxData } = useQuery(
    () => pharmacyApi.prescriptions.list({ status: 'PENDING', size: 50 }),
    [isRxModalOpen]
  );

  const applyPrescriptionToCart = useCallback(
    (rx: Prescription) => {
      setActiveRxNumber(rx.prescriptionNumber);
      setCustomerName(rx.patientName);
      if (rx.patientPhone) setCustomerPhone(rx.patientPhone);
      if (rx.patientId) setSelectedPatientId(rx.patientId);
      if (rx.doctorName) setDoctorName(rx.doctorName);

      // Map prescribed items to cart lines matching available inventory
      if (itemsPage?.content) {
        const newCartLines: CartLine[] = [];
        for (const prescItem of rx.items) {
          const med = itemsPage.content.find((i) => i.id === prescItem.itemId);
          if (med) {
            const unitType = prescItem.unitType || 'UNIT';
            const unitPrice =
              unitType === 'PACK' ? med.latestMrpPerPack || 0 : med.latestUnitMrp || 0;
            const quantity = prescItem.quantityPrescribed || 1;
            newCartLines.push({
              item: med,
              unitType,
              quantity,
              unitPrice,
              totalPrice: quantity * unitPrice,
              dosageInstruction: prescItem.dosage || prescItem.instructions || '1-0-1 After Food',
            });
          }
        }
        if (newCartLines.length > 0) {
          setCart(newCartLines);
          toast.success(
            t('Loaded {count} prescribed items from Rx #{num}', {
              count: newCartLines.length,
              num: rx.prescriptionNumber,
            })
          );
        }
      }
    },
    [itemsPage, t, toast]
  );

  // Auto-load if rx query param is present
  useEffect(() => {
    const rxParam = searchParams.get('rx');
    if (rxParam && itemsPage?.content) {
      pharmacyApi.prescriptions
        .getByNumber(rxParam)
        .then((rx) => applyPrescriptionToCart(rx))
        .catch(() => toast.error(t('Could not load prescription #{num}', { num: rxParam })));
    }
  }, [searchParams, itemsPage, applyPrescriptionToCart, t, toast]);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_FONEPAY' | 'CARD' | 'CREDIT'>('CASH');
  const [tenderAmount, setTenderAmount] = useState<number | string>('');
  const [refillDays, setRefillDays] = useState<number>(0);
  const [enableRefillReminder, setEnableRefillReminder] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hardware Barcode Scanner & Fast Counter Mode State
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isFastCounterMode, setIsFastCounterMode] = useState(false);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Clinical Safety & DDI Alert Engine State
  const [safetyResult, setSafetyResult] = useState<DrugSafetyCheckResponse | null>(null);
  const [overrideSevereWarning, setOverrideSevereWarning] = useState(false);
  const [_isSafetyChecking, setIsSafetyChecking] = useState(false);

  // Real-time Clinical Drug-Drug Interaction (DDI) & Allergy Check
  useEffect(() => {
    if (cart.length === 0) {
      setSafetyResult(null);
      setOverrideSevereWarning(false);
      return;
    }

    const itemIds = cart.map((c) => c.item.id);
    setIsSafetyChecking(true);
    pharmacyApi.safety
      .check({ itemIds, patientId: selectedPatientId })
      .then((res) => {
        setSafetyResult(res);
        if (!res.hasSevereContraindication) {
          setOverrideSevereWarning(false);
        }
      })
      .catch(() => {})
      .finally(() => setIsSafetyChecking(false));
  }, [cart, selectedPatientId]);

  const filteredItems = useMemo(() => {
    if (!itemsPage?.content) return [];
    if (selectedCategory === 'ALL') return itemsPage.content;
    return itemsPage.content.filter((item) => item.category === selectedCategory);
  }, [itemsPage, selectedCategory]);

  const addToCart = useCallback((item: PharmacyItem) => {
    if (item.totalStockUnits <= 0) {
      if (isSoundEnabled) playScanErrorSound();
      toast.error(t('Item is out of stock!'));
      return;
    }

    if (isSoundEnabled) playScanSuccessSound();
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        const lineTotal = nextQty * existing.unitPrice;
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: nextQty, totalPrice: lineTotal } : c));
      }

      const unitType: 'PACK' | 'UNIT' = item.packSize > 1 && item.totalStockPacks > 0 ? 'PACK' : 'UNIT';
      const unitPrice = unitType === 'PACK' ? (item.latestMrpPerPack || 0) : (item.latestUnitMrp || 0);

      return [
        ...prev,
        {
          item,
          unitType,
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice,
          dosageInstruction: '1-0-1 After Food',
        },
      ];
    });
  }, [isSoundEnabled, t, toast]);

  const updateLineUnit = (itemId: number, unitType: 'PACK' | 'UNIT') => {
    setCart((prev) =>
      prev.map((line) => {
        if (line.item.id !== itemId) return line;
        const unitPrice = unitType === 'PACK' ? (line.item.latestMrpPerPack || 0) : (line.item.latestUnitMrp || 0);
        return {
          ...line,
          unitType,
          unitPrice,
          totalPrice: unitPrice * line.quantity,
        };
      })
    );
  };

  const updateLineQty = (itemId: number, qty: number) => {
    if (qty <= 0) return;
    setCart((prev) =>
      prev.map((line) => (line.item.id === itemId ? { ...line, quantity: qty, totalPrice: line.unitPrice * qty } : line))
    );
  };

  const incrementQty = (itemId: number) => {
    setCart((prev) =>
      prev.map((line) =>
        line.item.id === itemId
          ? { ...line, quantity: line.quantity + 1, totalPrice: line.unitPrice * (line.quantity + 1) }
          : line
      )
    );
  };

  const decrementQty = (itemId: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.item.id !== itemId) return line;
          if (line.quantity <= 1) return null;
          return {
            ...line,
            quantity: line.quantity - 1,
            totalPrice: line.unitPrice * (line.quantity - 1),
          };
        })
        .filter((l): l is CartLine => l !== null)
    );
  };

  const updateLineDosage = (itemId: number, dosage: string) => {
    setCart((prev) => prev.map((line) => (line.item.id === itemId ? { ...line, dosageInstruction: dosage } : line)));
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm(t('Clear all medicines from the current bill?'))) {
      setCart([]);
      setTenderAmount('');
    }
  };

  const handleSelectPatient = (patient: PatientListItem) => {
    setCustomerName(patient.fullName);
    setCustomerPhone(patient.phone || '');
    setSelectedPatientId(patient.id);
    setIsPatientModalOpen(false);
    toast.success(t('Patient #{mrn} loaded', { mrn: patient.mrn }));
  };

  const resetToWalkIn = () => {
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setSelectedPatientId(undefined);
    setDoctorName('');
    setActiveRxNumber(null);
  };

  const subtotal = useMemo(() => cart.reduce((acc, c) => acc + c.totalPrice, 0), [cart]);

  const vatTotal = useMemo(() => {
    return cart.reduce((acc, c) => {
      if (c.item.isVatApplicable && c.item.vatPercentage > 0) {
        return acc + (c.totalPrice * c.item.vatPercentage) / 100;
      }
      return acc;
    }, 0);
  }, [cart]);

  const grandTotal = subtotal + vatTotal;

  // Tender cash calculations
  const parsedTender = typeof tenderAmount === 'number' ? tenderAmount : parseFloat(tenderAmount) || 0;
  const changeDue = Math.max(0, parsedTender - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(t('Cart is empty. Please add items to dispense.'));
      return;
    }

    if (safetyResult?.hasSevereContraindication && !overrideSevereWarning) {
      toast.error(t('Severe drug contraindication detected! Pharmacist authorization override is required to dispense.'));
      return;
    }

    try {
      setIsSubmitting(true);
      const itemsPayload: DispenseItemRequest[] = cart.map((c) => ({
        itemId: c.item.id,
        unitType: c.unitType,
        quantity: c.quantity,
        dosageInstruction: c.dosageInstruction,
      }));

      const res = await pharmacyApi.dispense.checkout({
        saleType: 'RETAIL',
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || undefined,
        patientId: selectedPatientId,
        doctorName: doctorName.trim() || undefined,
        paymentMethod,
        paidAmount: grandTotal,
        refillReminderDays: enableRefillReminder && refillDays > 0 ? refillDays : undefined,
        items: itemsPayload,
      });

      setReceipt(res);
      setCart([]);
      setTenderAmount('');

      // Auto-schedule chronic refill tracking and SMS reminders if selected
      if (enableRefillReminder && refillDays > 0 && customerPhone.trim()) {
        try {
          for (const c of cart) {
            await pharmacyApi.refills.create({
              patientId: selectedPatientId || undefined,
              patientName: customerName.trim() || 'Walk-in Customer',
              patientPhone: customerPhone.trim(),
              saleId: res.id,
              invoiceNumber: res.invoiceNumber,
              itemId: c.item.id,
              itemName: c.item.name,
              dispensedQuantity: c.quantity,
              unitType: c.unitType,
              dosageInstruction: c.dosageInstruction,
              courseDays: refillDays,
              notes: 'POS checkout chronic refill scheduled',
            });
          }
        } catch {
          // non-blocking
        }
      }

      if (activeRxNumber) {
        try {
          await pharmacyApi.prescriptions.markDispensed(activeRxNumber);
        } catch {
          // non-blocking
        }
        setActiveRxNumber(null);
      }
      toast.success(t('Bill #{inv} dispensed successfully!', { inv: res.invoiceNumber }));
      if (isSoundEnabled) playCheckoutDingSound();
      refetchItems();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to complete sale'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cart Hold & Recall
  const handleHoldCart = useCallback(() => {
    if (cart.length === 0) {
      toast.error(t('Cart is empty, nothing to hold'));
      return;
    }
    const newHold: HeldCart = {
      id: `HOLD-${Math.floor(1000 + Math.random() * 9000)}`,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      selectedPatientId,
      doctorName: doctorName.trim() || '',
      paymentMethod,
      cart: [...cart],
      subtotal,
      grandTotal,
    };
    setHeldCarts((prev) => [newHold, ...prev]);
    setCart([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setSelectedPatientId(undefined);
    setTenderAmount('');
    toast.success(t('Cart held ({id}). Counter cleared for next patient!', { id: newHold.id }));
  }, [cart, customerName, customerPhone, selectedPatientId, doctorName, paymentMethod, subtotal, grandTotal, t, toast]);

  const handleRecallCart = (held: HeldCart) => {
    setCart(held.cart);
    setCustomerName(held.customerName);
    setCustomerPhone(held.customerPhone || '');
    setSelectedPatientId(held.selectedPatientId);
    setDoctorName(held.doctorName);
    setPaymentMethod(held.paymentMethod);
    setHeldCarts((prev) => prev.filter((h) => h.id !== held.id));
    setIsHeldModalOpen(false);
    toast.success(t('Held cart ({id}) restored to counter!', { id: held.id }));
  };

  // Hardware Barcode Scanner & GS1 Wedge Resolver
  const handleBarcodeScanned = useCallback(
    (code: string) => {
      setLastScannedCode(code);
      const clean = code.trim().toLowerCase();

      // Look in currently loaded catalog
      const items = itemsPage?.content || [];
      const found = items.find(
        (it) =>
          (it.barcode && it.barcode.trim().toLowerCase() === clean) ||
          it.name.trim().toLowerCase() === clean
      );

      if (found) {
        if (found.totalStockUnits <= 0) {
          if (isSoundEnabled) playScanErrorSound();
          toast.error(t('{name} is OUT OF STOCK!', { name: found.name }));
        } else {
          addToCart(found);
          toast.success(t('Scanned: {name} (+1)', { name: found.name }));
        }
      } else {
        // Fallback: search backend for exact barcode or name
        pharmacyApi.items
          .list({ query: code, size: 5 })
          .then((res) => {
            const remoteItem =
              res.content?.find(
                (it) =>
                  (it.barcode && it.barcode.trim().toLowerCase() === clean) ||
                  it.name.trim().toLowerCase() === clean
              ) || res.content?.[0];

            if (remoteItem) {
              if (remoteItem.totalStockUnits <= 0) {
                if (isSoundEnabled) playScanErrorSound();
                toast.error(t('{name} is OUT OF STOCK!', { name: remoteItem.name }));
              } else {
                addToCart(remoteItem);
                toast.success(t('Scanned: {name} (+1)', { name: remoteItem.name }));
              }
            } else {
              if (isSoundEnabled) playScanErrorSound();
              toast.error(t('Barcode "{code}" not found in catalogue', { code }));
            }
          })
          .catch(() => {
            if (isSoundEnabled) playScanErrorSound();
            toast.error(t('Barcode "{code}" not found', { code }));
          });
      }
    },
    [itemsPage, isSoundEnabled, addToCart, t, toast]
  );

  // Global Keyboard Shortcuts & Hardware Barcode Scanner Wedge Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Function hotkeys
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMethod((prev) => {
          if (prev === 'CASH') return 'QR_FONEPAY';
          if (prev === 'QR_FONEPAY') return 'CARD';
          if (prev === 'CARD') return 'CREDIT';
          return 'CASH';
        });
        return;
      }
      if (e.key === 'F7') {
        e.preventDefault();
        setIsSoundEnabled((prev) => !prev);
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setIsFastCounterMode((prev) => !prev);
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckout();
        return;
      }
      if (e.key === 'F10') {
        e.preventDefault();
        handleHoldCart();
        return;
      }

      // Barcode Wedge Detection:
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        const scanned = buffer.trim();
        buffer = '';
        if (scanned.length >= 3) {
          if (isInput) {
            (target as HTMLInputElement).blur();
          }
          handleBarcodeScanned(scanned);
        }
        return;
      }

      // If user typed slowly (>180ms between keystrokes), it's manual typing, reset buffer
      if (timeDiff > 180) {
        buffer = '';
      }

      if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleBarcodeScanned, handleCheckout, handleHoldCart]);

  return (
    <div className="space-y-4">
      {/* Shared Pharmacy Sub-Navigation */}
      <PharmacyHeader />

      {/* POS Toolbar & Hotkeys Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface p-3 shadow-xs" data-print-hide>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-foreground">
            {t('Counter Billing & Dispensing Desk')}
          </span>
          <Badge tone="info" variant="subtle">
            {t('FEFO FIFO Active')}
          </Badge>

          {/* Hardware Scanner Active Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Scan className="h-3 w-3 animate-pulse text-emerald-600" />
            <span>{lastScannedCode ? `Last: ${lastScannedCode}` : t('Scanner Ready')}</span>
          </span>
        </div>

        {/* Action Controls & Hotkeys */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Sound Toggle (F7) */}
          <button
            type="button"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            title={t('Toggle Scanner Sound Chime (F7)')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
              isSoundEnabled
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-surface-muted text-muted hover:text-foreground'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5 text-muted" />}
            <span className="font-mono text-[10px]">F7</span>
          </button>

          {/* Fast Counter Mode (F8) */}
          <button
            type="button"
            onClick={() => setIsFastCounterMode(!isFastCounterMode)}
            title={t('Toggle Fast Counter Express Mode (F8)')}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              isFastCounterMode
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-surface-muted text-muted hover:text-foreground'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{t('Fast Counter')}</span>
            <span className="font-mono text-[10px] opacity-75">F8</span>
          </button>

          {/* Hold Cart (F10) */}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={cart.length === 0}
            onClick={handleHoldCart}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>{t('Hold (F10)')}</span>
          </Button>

          {/* Recall Held Carts */}
          {heldCarts.length > 0 && (
            <button
              type="button"
              onClick={() => setIsHeldModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-800 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 animate-pulse"
            >
              <PlayCircle className="h-3.5 w-3.5 text-purple-600" />
              <span>{t('Recall Held ({n})', { n: heldCarts.length })}</span>
            </button>
          )}

          {/* Hotkey Guide */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 text-[11px] text-muted border-l border-border/80">
            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono font-bold text-foreground">F2</span>
            <span>Search</span>
            <span className="text-border">·</span>
            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono font-bold text-foreground">F4</span>
            <span>Payment</span>
            <span className="text-border">·</span>
            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono font-bold text-foreground">F9</span>
            <span>Dispense</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-print-hide>
        {/* Left Side: Product Catalog & Search (Responsive based on Fast Counter Mode) */}
        <div className={`space-y-4 ${isFastCounterMode ? 'lg:col-span-5' : 'lg:col-span-7'}`}>
          {isFastCounterMode && (
            <div className="rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/60 p-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
              <Scan className="h-4 w-4 text-emerald-600 animate-pulse" />
              <span>{t('FAST COUNTER ACTIVE: Barcode scanner will auto-add medicines to bill without clicking')}</span>
            </div>
          )}
          {/* Search bar & Category chips */}
          <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Search by brand name, generic formula, barcode, or rack... (Press F2)')}
                className="pl-10 text-sm h-10 shadow-xs"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-xs text-muted hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: 'ALL', label: t('All Products') },
                { id: 'ALLOPATHIC', label: t('Allopathic / Rx') },
                { id: 'SKINCARE', label: t('Skincare & Derm (13% VAT)') },
                { id: 'SURGICAL', label: t('Surgical / Devices') },
                { id: 'AYURVEDIC', label: t('Ayurvedic') },
                { id: 'NUTRACEUTICAL', label: t('Nutraceuticals') },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-surface-muted text-muted hover:bg-surface-elevated hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {itemsLoading && !itemsPage ? (
              <div className="col-span-full py-12 text-center text-muted">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                <p className="mt-2 text-sm">{t('Scanning pharmacy items...')}</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted space-y-2">
                <Pill className="mx-auto h-8 w-8 text-muted/60" />
                <p className="font-semibold text-foreground">{t('No matching medicines or products found')}</p>
                <p className="text-xs">{t('Try adjusting your search query or category filter.')}</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isOutOfStock = item.totalStockUnits <= 0;
                const isLowStock = !isOutOfStock && item.totalStockUnits < item.minStockLevel;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 ${
                      isOutOfStock
                        ? 'border-border/50 bg-surface-muted/40 opacity-60 cursor-not-allowed'
                        : 'border-border/80 bg-surface hover:border-primary-500 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Top status badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary-600 transition">
                            {item.name}
                          </h4>
                          {item.genericName && (
                            <p className="text-xs text-muted truncate">{item.genericName}</p>
                          )}
                        </div>

                        {item.isVatApplicable ? (
                          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
                            13% VAT
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted">
                            0% Exempt
                          </span>
                        )}
                      </div>

                      {/* Stock info and rack location */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 font-bold text-danger">
                            ● {t('Out of Stock')}
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            ● {item.totalStockPacks} {item.packUnit} ({item.totalStockUnits} {item.dispensingUnit})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            ✓ {item.totalStockPacks} {item.packUnit} ({item.totalStockUnits} {item.dispensingUnit})
                          </span>
                        )}

                        {item.rackLocation && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                            <MapPin className="h-3 w-3" />
                            {item.rackLocation}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                      <div>
                        {item.packSize > 1 ? (
                          <>
                            <span className="font-bold text-foreground">
                              Rs. {(item.latestMrpPerPack || 0).toFixed(2)}
                            </span>
                            <span className="text-[11px] text-muted">
                              {' '}
                              / {item.packUnit} (Rs. {(item.latestUnitMrp || 0).toFixed(2)}/{item.dispensingUnit})
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-foreground">
                            Rs. {(item.latestUnitMrp || 0).toFixed(2)} / {item.dispensingUnit}
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="h-7 text-xs px-2.5"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {t('Add')}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Dispensing Counter / Active Cart */}
        <div className={`space-y-4 ${isFastCounterMode ? 'lg:col-span-7' : 'lg:col-span-5'}`}>
          <div className="flex flex-col rounded-xl border border-border/80 bg-surface p-4 shadow-sm space-y-4">
            {/* Customer & Prescriber Header */}
            <div className="space-y-2 border-b border-border/60 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t('Customer / Patient')}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRxModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-md px-2 py-0.5 hover:bg-amber-100 transition shadow-xs"
                  >
                    <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                    {t('Pull Rx')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPatientModalOpen(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    <User className="h-3.5 w-3.5" />
                    {t('Lookup Patient')}
                  </button>

                  {(selectedPatientId || activeRxNumber) && (
                    <button
                      type="button"
                      onClick={resetToWalkIn}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      ({t('Reset')})
                    </button>
                  )}
                </div>
              </div>

              {activeRxNumber && (
                <div className="flex items-center justify-between rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 px-2.5 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                    <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                    Rx: {activeRxNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveRxNumber(null)}
                    className="text-[11px] text-amber-700 hover:underline font-semibold"
                  >
                    {t('Detach')}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('Customer Name')}
                  className="text-xs"
                />
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t('Phone Number')}
                  className="text-xs"
                />
              </div>

              {/* Prescribing Doctor Attribution */}
              <div className="pt-1">
                <div className="flex items-center gap-1 text-xs text-muted mb-1">
                  <Stethoscope className="h-3 w-3" />
                  <span>{t('Prescribing Doctor (Optional)')}</span>
                </div>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-primary-500 focus:outline-none"
                >
                  <option value="">{t('— Self / OPD Walk-in (No Doctor) —')}</option>
                  {doctorsData?.content?.map((d) => (
                    <option key={d.id} value={d.fullName}>
                      Dr. {d.fullName} {d.specialization ? `(${d.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Header & Counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-foreground">{t('Dispense Items')}</h3>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {cart.length}
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center gap-1 text-xs text-danger hover:underline font-medium"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t('Clear Cart')}
                </button>
              )}
            </div>

            {/* Line Items List */}
            <div className="max-h-[300px] min-h-[140px] space-y-2.5 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center text-muted">
                  <ShoppingCart className="h-6 w-6 text-muted/50 mb-1" />
                  <p className="text-xs font-medium">{t('No items in counter cart')}</p>
                  <p className="text-[11px] text-muted/80">{t('Select medicines from the left to start dispensing')}</p>
                </div>
              ) : (
                cart.map((line) => (
                  <div
                    key={line.item.id}
                    className="rounded-lg border border-border/80 bg-surface-muted/30 p-2.5 text-xs shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-foreground">{line.item.name}</span>
                        {line.item.isVatApplicable && (
                          <span className="ml-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            (13% VAT)
                          </span>
                        )}
                        <div className="text-[10px] text-muted">{line.item.genericName}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(line.item.id)}
                        className="text-muted hover:text-danger transition p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Unit Switcher & Stepper Controls */}
                    <div className="flex items-center justify-between gap-2">
                      {line.item.packSize > 1 ? (
                        <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
                          <button
                            type="button"
                            onClick={() => updateLineUnit(line.item.id, 'PACK')}
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                              line.unitType === 'PACK'
                                ? 'bg-primary-600 text-white shadow-2xs'
                                : 'text-muted hover:text-foreground'
                            }`}
                          >
                            {line.item.packUnit} ({line.item.packSize})
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLineUnit(line.item.id, 'UNIT')}
                            className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                              line.unitType === 'UNIT'
                                ? 'bg-primary-600 text-white shadow-2xs'
                                : 'text-muted hover:text-foreground'
                            }`}
                          >
                            {line.item.dispensingUnit} (Loose)
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted">{line.item.packUnit}</span>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Stepper buttons */}
                        <div className="flex items-center rounded-md border border-border bg-surface">
                          <button
                            type="button"
                            onClick={() => decrementQty(line.item.id)}
                            className="px-2 py-1 text-muted hover:bg-surface-muted hover:text-foreground transition rounded-l"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLineQty(line.item.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center font-bold text-xs bg-transparent border-0 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => incrementQty(line.item.id)}
                            className="px-2 py-1 text-muted hover:bg-surface-muted hover:text-foreground transition rounded-r"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-foreground min-w-[70px] text-right">
                          Rs. {line.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Dosage Instructions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted shrink-0">{t('Dose:')}</span>
                      <select
                        value={line.dosageInstruction}
                        onChange={(e) => updateLineDosage(line.item.id, e.target.value)}
                        className="w-full rounded border border-border bg-surface px-2 py-0.5 text-[11px] text-foreground focus:border-primary-500 focus:outline-none"
                      >
                        {DOSAGE_PRESETS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1.5 border-t border-border/80 pt-3 text-xs">
              <div className="flex justify-between text-muted">
                <span>{t('Subtotal (Item Total)')}</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>

              {vatTotal > 0 && (
                <div className="flex justify-between font-semibold text-amber-600 dark:text-amber-400">
                  <span>{t('VAT 13% (Cosmetics / Taxable)')}</span>
                  <span>+ Rs. {vatTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-foreground border-t border-border/80 pt-2">
                <span>{t('Net Grand Total')}</span>
                <span className="text-primary-600 dark:text-primary-400">Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {t('Payment Mode')}
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'CASH', label: t('Cash'), icon: Banknote },
                  { id: 'QR_FONEPAY', label: t('Fonepay'), icon: QrCode },
                  { id: 'CARD', label: t('Card'), icon: CreditCard },
                  { id: 'CREDIT', label: t('Credit'), icon: Building },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMethod === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id as any)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 font-bold transition ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'border border-border bg-surface-muted/50 text-muted hover:bg-surface-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px]">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered Calculator (Active on CASH) */}
            {paymentMethod === 'CASH' && grandTotal > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    {t('Cash Received from Customer:')}
                  </span>
                  <div className="w-28">
                    <Input
                      type="number"
                      min={grandTotal}
                      value={tenderAmount}
                      onChange={(e) => setTenderAmount(e.target.value)}
                      placeholder={grandTotal.toFixed(0)}
                      className="text-right font-bold text-xs h-7"
                    />
                  </div>
                </div>

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setTenderAmount(grandTotal)}
                    className="rounded border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-gray-800 dark:text-emerald-300"
                  >
                    {t('Exact')}
                  </button>
                  {[100, 500, 1000].map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setTenderAmount(note)}
                      className="rounded border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-gray-800 dark:text-emerald-300"
                    >
                      Rs. {note}
                    </button>
                  ))}
                </div>

                {parsedTender > 0 && (
                  <div className="flex justify-between items-center border-t border-emerald-200/80 pt-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                    <span>{t('Change to Return:')}</span>
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                      Rs. {changeDue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Refill Reminder */}
            <div className="rounded-lg border border-border bg-surface-muted/30 p-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={enableRefillReminder}
                  onChange={(e) => setEnableRefillReminder(e.target.checked)}
                  className="rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary-600" />
                  {t('Send SMS Refill Reminder when course ends')}
                </span>
              </label>
              {enableRefillReminder && (
                <div className="mt-2 flex items-center gap-2 pl-5">
                  <span className="text-muted">{t('Course duration:')}</span>
                  <Input
                    type="number"
                    min="1"
                    className="w-16 text-center py-0.5 text-xs h-7"
                    value={refillDays}
                    onChange={(e) => setRefillDays(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-muted">{t('days')}</span>
                </div>
              )}
            </div>

            {/* Clinical Safety & Drug-Drug Interaction (DDI) Guardrail Banner */}
            {cart.length > 0 && safetyResult && (
              <div className="space-y-2">
                {/* 1. Critical Severe Contraindications */}
                {safetyResult.hasSevereContraindication && (
                  <div className="rounded-xl border-2 border-red-500 bg-red-50 p-3.5 text-xs text-red-950 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200 space-y-2.5 shadow-sm">
                    <div className="flex items-center gap-2 font-black text-red-700 dark:text-red-400">
                      <ShieldAlert className="h-5 w-5 shrink-0 animate-pulse text-red-600" />
                      <span>{t('CRITICAL DRUG CONTRAINDICATION DETECTED')}</span>
                    </div>

                    <div className="space-y-2 divide-y divide-red-200 dark:divide-red-800/40 text-[11px]">
                      {safetyResult.interactions
                        .filter((i) => i.severity === 'SEVERE_CONTRAINDICATED')
                        .map((alert, idx) => (
                          <div key={idx} className="pt-1.5 space-y-1">
                            <div className="font-bold text-red-900 dark:text-red-100 flex items-center justify-between">
                              <span>
                                {alert.drugAName} ↔ {alert.drugBName}
                              </span>
                              <Badge tone="danger">{t('Contraindicated')}</Badge>
                            </div>
                            <p className="font-semibold text-red-800 dark:text-red-300">{alert.interactionTitle}</p>
                            <p className="text-red-700 dark:text-red-400">{alert.clinicalEffect}</p>
                            <div className="rounded bg-white/70 p-1.5 font-medium text-red-900 dark:bg-gray-900/60 dark:text-red-200 border border-red-200 dark:border-red-800">
                              <span className="font-bold">{t('Advice:')} </span>
                              {alert.recommendation}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Pharmacist Authorization Override Checkbox */}
                    <div className="border-t border-red-200 dark:border-red-800/60 pt-2">
                      <label className="flex items-start gap-2 cursor-pointer font-bold text-red-900 dark:text-red-200">
                        <input
                          type="checkbox"
                          checked={overrideSevereWarning}
                          onChange={(e) => setOverrideSevereWarning(e.target.checked)}
                          className="mt-0.5 rounded border-red-400 text-red-600 focus:ring-red-500"
                        />
                        <span>
                          {t('Authorized Pharmacist Override: Confirmed with Prescribing Doctor & Patient Monitored')}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 2. Patient Drug Allergy Warnings */}
                {safetyResult.hasAllergyWarning && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{t('Patient Known Drug Allergy Alert')}</span>
                    </div>
                    {safetyResult.allergies.map((allergy, idx) => (
                      <div key={idx} className="text-[11px] pl-6">
                        <span className="font-bold">{allergy.itemName}</span> {t('matches known allergy')} <span className="font-mono font-bold text-red-600">[{allergy.allergenGeneric}]</span>. {allergy.reactionDetails || ''}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Moderate Interactions & Counseling Tips */}
                {!safetyResult.hasSevereContraindication && safetyResult.interactions.some((i) => i.severity === 'MODERATE_MONITOR') && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>{t('Moderate Interaction · Patient Counseling Advised')}</span>
                    </div>
                    {safetyResult.interactions
                      .filter((i) => i.severity === 'MODERATE_MONITOR')
                      .map((alert, idx) => (
                        <div key={idx} className="text-[11px] pl-6 space-y-0.5">
                          <span className="font-bold">{alert.drugAName} ↔ {alert.drugBName}:</span> {alert.recommendation}
                        </div>
                      ))}
                  </div>
                )}

                {/* 4. Safety Verified Pill */}
                {!safetyResult.hasSevereContraindication && !safetyResult.hasAllergyWarning && safetyResult.interactions.length === 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t('Clinical Safety Verified · 0 Known Contraindications')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Action Button */}
            <Button
              onClick={handleCheckout}
              disabled={
                cart.length === 0 ||
                isSubmitting ||
                (safetyResult?.hasSevereContraindication === true && !overrideSevereWarning)
              }
              className={`w-full text-sm font-extrabold py-3 shadow-md ${
                safetyResult?.hasSevereContraindication && !overrideSevereWarning
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-not-allowed'
                  : ''
              }`}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isSubmitting
                ? t('Processing Dispense...')
                : safetyResult?.hasSevereContraindication && !overrideSevereWarning
                  ? t('Awaiting Pharmacist Clinical Override...')
                  : `${t('Dispense & Print Bill')} (F9) — Rs. ${grandTotal.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Search & Lookup Modal */}
      {isPatientModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsPatientModalOpen(false)}
          title={t('Lookup Hospital Patient')}
          description={t('Search registered patient records to link this prescription sale.')}
          size="md"
        >
          <div className="p-2 space-y-4">
            <PatientPicker onSelect={handleSelectPatient} />
          </div>
        </Modal>
      )}

      {/* Pull Doctor Rx Modal */}
      {isRxModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsRxModalOpen(false)}
          title={t('Select Doctor E-Prescription (Pending Dispense)')}
          size="lg"
        >
          <div className="space-y-3">
            <p className="text-xs text-muted">
              {t('Select an active outpatient prescription to populate patient details and prescribed medicines automatically.')}
            </p>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {pendingRxData?.content && pendingRxData.content.length > 0 ? (
                pendingRxData.content.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary-500 bg-surface hover:bg-surface-muted/50 transition cursor-pointer"
                    onClick={() => {
                      applyPrescriptionToCart(rx);
                      setIsRxModalOpen(false);
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{rx.prescriptionNumber}</span>
                        <span className="text-xs font-semibold text-foreground">{rx.patientName}</span>
                        {rx.patientMrn && <span className="text-[11px] text-muted font-mono">({rx.patientMrn})</span>}
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-2 mt-1">
                        <span>Dr. {rx.doctorName}</span>
                        <span>·</span>
                        <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span className="font-bold text-foreground">{rx.items.length} items</span>
                      </div>
                    </div>

                    <Button size="sm" className="h-7 text-xs gap-1 font-semibold">
                      <ShoppingCart className="h-3 w-3" />
                      {t('Load to Cart')}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted">
                  <ClipboardList className="mx-auto h-8 w-8 text-muted/40 mb-2" />
                  <p className="font-semibold text-foreground">{t('No pending doctor prescriptions')}</p>
                  <p className="text-xs">{t('All prescriptions have already been dispensed or none are logged.')}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Dedicated Printable Receipt Layout (Rendered only on print via #pharmacy-receipt-print) */}
      {receipt && (
        <div className="hidden print:block">
          <PharmacyReceiptPrint receipt={receipt} isPrintDocument={true} />
        </div>
      )}

      {/* Thermal / A4 Print Receipt Modal */}
      {receipt && (
        <Modal
          open={true}
          onClose={() => setReceipt(null)}
          title={t('Dispense Receipt #{inv}', { inv: receipt.invoiceNumber })}
          size="md"
        >
          <div className="space-y-4">
            <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-border bg-gray-50 p-3 shadow-inner dark:bg-gray-900">
              <PharmacyReceiptPrint receipt={receipt} />
            </div>

            <div className="flex gap-2 pt-2" data-print-hide>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Receipt')}
              </Button>
              <Button className="flex-1" onClick={() => setReceipt(null)}>
                {t('Done (Next Customer)')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Held Carts Recall Modal */}
      {isHeldModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsHeldModalOpen(false)}
          title={t('Held Customer Carts Queue')}
          description={t('Select a previously held cart to restore it to the counter.')}
        >
          <div className="space-y-2.5 pt-2">
            {heldCarts.length === 0 ? (
              <p className="text-center text-xs text-muted py-6">{t('No customer carts currently on hold.')}</p>
            ) : (
              heldCarts.map((held) => (
                <div
                  key={held.id}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-surface p-3 shadow-xs hover:border-primary/50 transition"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                      <span className="font-mono text-purple-700 dark:text-purple-300">{held.id}</span>
                      <span>·</span>
                      <span>{held.customerName}</span>
                      {held.customerPhone && <span className="text-muted font-normal">({held.customerPhone})</span>}
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">
                      {held.heldAt} · {held.cart.length} items · Mode: {held.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-foreground text-xs">
                      Rs. {held.grandTotal.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleRecallCart(held)}
                      className="h-7 text-xs font-bold gap-1"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      {t('Restore')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PharmacyPosPage;
