package np.com.lims.revenue;

import np.com.lims.billing.InvoiceRepository;
import np.com.lims.billing.RefundRepository;
import np.com.lims.billing.entity.Invoice;
import np.com.lims.billing.entity.PaymentMethod;
import np.com.lims.billing.entity.Refund;
import np.com.lims.branch.BranchRepository;
import np.com.lims.branch.entity.Branch;
import np.com.lims.catalog.LabTestRepository;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.catalog.entity.TestType;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.department.DepartmentRepository;
import np.com.lims.department.entity.Department;
import np.com.lims.order.LabOrderRepository;
import np.com.lims.order.OrderPricingCalculator;
import np.com.lims.order.entity.DiscountType;
import np.com.lims.order.entity.LabOrder;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patient.entity.PatientCategory;
import np.com.lims.patient.entity.Payer;
import np.com.lims.patient.entity.PayerType;
import np.com.lims.patient.entity.RegistrationChannel;
import np.com.lims.platform.OrganizationRepository;
import np.com.lims.platform.entity.Organization;
import np.com.lims.revenue.RevenueDtos.Breakdown;
import np.com.lims.revenue.RevenueDtos.GroupRow;
import np.com.lims.revenue.RevenueDtos.Summary;
import np.com.lims.revenue.RevenueDtos.TestRow;
import np.com.lims.revenue.RevenuePeriod.Range;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validates the revenue figures against real rows in a real MySQL, through the real schema.
 *
 * <p>The scenario is built to contain every trap the money model allows: a draft that was never
 * issued, an invoice cancelled after a full refund, a partial payment, two payments against one
 * invoice, a partially refunded payment (which flips the whole payment's {@code reversed} flag), a
 * refund still awaiting approval, a rejected refund, a profile billed as a package, a line
 * discount and an invoice discount together, VAT, a credit settlement, and a second organization's
 * invoices that must never appear.
 *
 * <p>Timestamps are left as "now", so the whole scenario falls inside today. That makes the
 * assertions about which date column drives which figure testable without clock injection: a
 * payment taken today against an invoice issued today must count once in each.
 *
 * <p>Runs against the ambient MySQL the build already provides — the {@code mysql} service in CI,
 * a local instance otherwise — rather than starting its own container, matching how the CI
 * workflow supplies a database. Every test is transactional and rolls back, so a development
 * database is left exactly as it was found, and each scenario is built under its own freshly
 * created organization so it can never collide with existing data.
 */
@SpringBootTest
@Transactional
class RevenueAccuracyIntegrationTest {

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("lims.security.jwt.secret", () -> "integration-test-secret-integration-test-secret");
    }

    @Autowired RevenueService service;
    @Autowired OrganizationRepository organizations;
    @Autowired PatientRepository patients;
    @Autowired DepartmentRepository departments;
    @Autowired LabTestRepository tests;
    @Autowired BranchRepository branches;
    @Autowired LabOrderRepository orders;
    @Autowired InvoiceRepository invoices;
    @Autowired RefundRepository refunds;
    @Autowired np.com.lims.settings.LaboratoryProfileService laboratoryProfiles;

    private final OrderPricingCalculator pricing = new OrderPricingCalculator();
    private static final Range TODAY = RevenuePeriod.of(RevenuePeriod.Preset.TODAY, RevenuePeriod.today());

    private Long orgId;
    private int seq;

    @BeforeEach
    void setUp() {
        orgId = organizations.save(Organization.create("rev-" + System.nanoTime(), "Revenue Test Clinic")).getId();
        TenantContext.set(orgId);
        // The summary embeds the laboratory letterhead, so the tenant needs its profile — the same
        // call that provisions a newly onboarded clinic.
        laboratoryProfiles.ensureProvisioned(orgId, "Revenue Test Clinic");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ----- fixture helpers -------------------------------------------------------------------

    private LabTest test(String code, String name, String price, TestType type, Department dept, String category) {
        LabTest t = LabTest.create(code, name, dept);
        t.updateDetails(name, type, dept, category, SpecimenType.BLOOD_SERUM, null, null,
                new BigDecimal(price), null, null);
        return tests.save(t);
    }

    private Patient patient(String name, PatientCategory category, PayerType payerType, String payerName) {
        Patient p = Patient.register("P%06d".formatted(++seq), name, Gender.OTHER);
        p.applyClassification(category, RegistrationChannel.WALK_IN, null, null);
        p.applyPayer(new Payer(payerType, payerName, null, null, null, null, null));
        return patients.save(p);
    }

    /** An invoice in DRAFT, priced through the one authoritative calculator. */
    private Invoice draft(Patient p, Branch branch, DiscountType discountType, String discountValue,
                          String taxRate, Object... testsAndDiscounts) {
        LabOrder order = LabOrder.open("ORD%06d".formatted(++seq), p, null, branch, null);
        for (int i = 0; i < testsAndDiscounts.length; i += 2) {
            LabTest t = (LabTest) testsAndDiscounts[i];
            String lineDiscount = (String) testsAndDiscounts[i + 1];
            order.addItem(t, 1, lineDiscount == null ? null : new BigDecimal(lineDiscount));
        }
        order.confirm();
        orders.save(order);

        Invoice invoice = Invoice.openFor(order, "2082/83");
        var r = pricing.compute(invoice.getItems().stream().map(np.com.lims.billing.entity.InvoiceItem::getLineTotal).toList(),
                discountType, discountValue == null ? null : new BigDecimal(discountValue),
                taxRate == null ? null : new BigDecimal(taxRate));
        invoice.applyPricing(r.discountType(), r.discountValue(), r.taxRate(), r.subtotal(), r.discountAmount(),
                r.taxableAmount(), r.taxAmount(), r.totalAmount());
        return invoices.save(invoice);
    }

    private Invoice issued(Patient p, Branch branch, DiscountType dt, String dv, String tax, Object... items) {
        Invoice i = draft(p, branch, dt, dv, tax, items);
        i.issue("tester", "INV-2082/83-%06d".formatted(++seq), "2082/83");
        return invoices.save(i);
    }

    /**
     * Approves a refund against an invoice, optionally naming its most recent payment.
     *
     * <p>Always works through the instance the repository hands back, never the one passed in: a
     * save of an already-persisted entity goes through merge, so the caller's object (and any
     * child it is holding onto) can be a detached copy whose children were never written.
     */
    private Invoice approveRefund(Invoice invoice, String amount, boolean againstLastPayment) {
        // The payment rows cascade from the invoice, so they have to reach the database before a
        // refund can hold a foreign key to one.
        Invoice managed = invoices.saveAndFlush(invoice);
        List<np.com.lims.billing.entity.Payment> paid = managed.getPayments();
        np.com.lims.billing.entity.Payment against =
                againstLastPayment && !paid.isEmpty() ? paid.get(paid.size() - 1) : null;
        Refund r = managed.requestRefund(new BigDecimal(amount), "test refund", against, "requester");
        r.approve("approver", null);
        managed.applyApprovedRefund(r);
        return invoices.saveAndFlush(managed);
    }

    // ----- the scenario ----------------------------------------------------------------------

    private record Scenario(Department dept, LabTest cbc, LabTest lipid, LabTest profile, Branch main) {
    }

    private Scenario scenario() {
        Department haem = departments.save(Department.create("HAEM", "Haematology"));
        Department biochem = departments.save(Department.create("BIO", "Biochemistry"));
        Branch main = branches.save(Branch.create("MAIN", "Main Branch"));

        LabTest cbc = test("CBC", "Complete Blood Count", "500.00", TestType.ANALYTE, haem, "Hematology");
        LabTest lipid = test("LIPID", "Lipid Profile Panel", "1200.00", TestType.ANALYTE, biochem, "Biochemistry");
        LabTest profile = test("PKG1", "Full Body Checkup", "3000.00", TestType.PROFILE, biochem, "Packages");
        profile.addProfileMember(cbc, 1);
        profile.addProfileMember(lipid, 2);
        tests.save(profile);

        Patient walkIn = patient("Walk In Patient", PatientCategory.WALK_IN, PayerType.SELF, null);
        Patient corporate = patient("Corporate Patient", PatientCategory.CORPORATE, PayerType.CORPORATE, "Acme Industries");

        // 1. Fully paid in cash: 500 + 1200 = 1700, no discount, 13% VAT -> 1921.00
        Invoice fullyPaid = issued(walkIn, main, DiscountType.NONE, null, "13", cbc, null, lipid, null);
        fullyPaid.recordPayment(new BigDecimal("1921.00"), PaymentMethod.CASH, "R-1", null, "cashier-a");
        invoices.saveAndFlush(fullyPaid);

        // 2. A package, part paid by two payments: 3000 - 10% = 2700, no VAT
        Invoice packageInvoice = issued(walkIn, main, DiscountType.PERCENT, "10", null, profile, null);
        packageInvoice.recordPayment(new BigDecimal("1000.00"), PaymentMethod.CARD, "R-2", null, "cashier-a");
        packageInvoice.recordPayment(new BigDecimal("700.00"), PaymentMethod.DIGITAL_WALLET, "R-3", null, "system:ESEWA");
        invoices.saveAndFlush(packageInvoice);

        // 3. Corporate, settled on account (credit), with a line discount: (500-50) + 1200 = 1650
        Invoice onAccount = issued(corporate, main, DiscountType.NONE, null, null, cbc, "50", lipid, null);
        onAccount.recordPayment(new BigDecimal("1650.00"), PaymentMethod.CREDIT, "PO-9", null, "cashier-b");
        invoices.saveAndFlush(onAccount);

        // 4. Paid, then partially refunded — the refund names the payment, flipping its reversed flag
        Invoice partlyRefunded = issued(walkIn, main, DiscountType.NONE, null, null, lipid, null);
        partlyRefunded.recordPayment(new BigDecimal("1200.00"), PaymentMethod.CASH, "R-4", null, "cashier-a");
        approveRefund(partlyRefunded, "200.00", true);

        // 5. Paid in full, then fully refunded with no payment named, then cancelled
        Invoice cancelled = issued(walkIn, main, DiscountType.NONE, null, null, cbc, null);
        cancelled.recordPayment(new BigDecimal("500.00"), PaymentMethod.CASH, "R-5", null, "cashier-b");
        Invoice voided = approveRefund(cancelled, "500.00", false);
        voided.cancel("tester", "duplicate order");
        invoices.saveAndFlush(voided);

        // 6. Unpaid: pure outstanding
        issued(walkIn, main, DiscountType.NONE, null, null, lipid, null);

        // 7. A draft that was never issued — must be invisible everywhere
        draft(walkIn, main, DiscountType.NONE, null, null, cbc, null);

        // 8. A refund requested but not decided, and one rejected — neither moves money
        Invoice withPendingRefund = issued(walkIn, main, DiscountType.NONE, null, null, cbc, null);
        withPendingRefund.recordPayment(new BigDecimal("500.00"), PaymentMethod.CASH, "R-6", null, "cashier-a");
        invoices.saveAndFlush(withPendingRefund);
        withPendingRefund.requestRefund(new BigDecimal("100.00"), "pending", null, "requester");
        Refund rejected = withPendingRefund.requestRefund(new BigDecimal("50.00"), "rejected", null, "requester");
        rejected.reject("approver", "not justified");
        invoices.saveAndFlush(withPendingRefund);
        return new Scenario(haem, cbc, lipid, profile, main);
    }

    /** This test organization's invoices only — see the note in the reconciliation test. */
    private List<Invoice> myInvoices() {
        return invoices.findAll().stream().filter(i -> orgId.equals(i.getOrganizationId())).toList();
    }

    // ----- assertions ------------------------------------------------------------------------

    @Test
    void billedCollectedAndOutstandingAreEachMeasuredSeparatelyAndCorrectly() {
        scenario();
        Summary s = service.summary(TODAY, null);

        // Billed: the six ISSUED invoices only. The cancelled one and the draft are both excluded.
        // 1921 + 2700 + 1650 + 1200 + 1200 + 500 = 9171
        assertThat(s.billing().invoiceCount()).isEqualTo(6);
        assertThat(s.billing().totalBilled()).isEqualByComparingTo("9171.00");

        // Gross is every line at full price, before any discount:
        // (500+1200) + 3000 + (500+1200) + 1200 + 1200 + 500 = 9300
        assertThat(s.billing().grossCharges()).isEqualByComparingTo("9300.00");
        assertThat(s.billing().lineDiscounts()).isEqualByComparingTo("50.00");
        assertThat(s.billing().invoiceDiscounts()).isEqualByComparingTo("300.00");
        assertThat(s.billing().totalDiscounts()).isEqualByComparingTo("350.00");
        // Subtotal = gross - line discounts = 9250; taxable = subtotal - invoice discount = 8950
        assertThat(s.billing().subtotal()).isEqualByComparingTo("9250.00");
        assertThat(s.billing().taxableAmount()).isEqualByComparingTo("8950.00");
        assertThat(s.billing().taxAmount()).isEqualByComparingTo("221.00"); // 13% of 1700
        assertThat(s.billing().taxableAmount().add(s.billing().taxAmount())).isEqualByComparingTo(s.billing().totalBilled());

        // Collected: EVERY payment taken today, including the one against the cancelled invoice and
        // the one whose `reversed` flag got flipped by a partial refund.
        // 1921 + 1000 + 700 + 1650 + 1200 + 500 + 500 = 7471
        assertThat(s.collections().paymentCount()).isEqualTo(7);
        assertThat(s.collections().grossCollected()).isEqualByComparingTo("7471.00");

        // Refunds: only the two APPROVED ones. The pending and the rejected are ignored.
        assertThat(s.refunds().count()).isEqualTo(2);
        assertThat(s.refunds().amount()).isEqualByComparingTo("700.00");
        assertThat(s.netCollected()).isEqualByComparingTo("6771.00");

        // A credit settlement is money owed on account, not cash in the till.
        assertThat(s.collections().onAccount()).isEqualByComparingTo("1650.00");
        assertThat(s.collections().cashAndBank()).isEqualByComparingTo("5821.00");

        // Outstanding on invoices issued today: package 1000 + partly-refunded 200 + unpaid 1200 = 2400
        assertThat(s.billing().outstanding()).isEqualByComparingTo("2400.00");
        assertThat(s.billing().outstandingInvoiceCount()).isEqualTo(3);

        // The cancellation bridge explains why re-running this period later gives a smaller total.
        assertThat(s.cancelled().count()).isEqualTo(1);
        assertThat(s.cancelled().issuedThenCancelledCount()).isEqualTo(1);
        assertThat(s.cancelled().issuedThenCancelledAmount()).isEqualByComparingTo("500.00");
        assertThat(s.cancelled().billedAsIssued()).isEqualByComparingTo("9671.00");
    }

    @Test
    void collectionsReconcileToTheInvoicesOwnNetPaidDefinition() {
        scenario();
        Summary s = service.summary(TODAY, null);

        // The identity that makes the ledger basis trustworthy: summing payments and subtracting
        // approved refunds must equal what the invoices themselves think they have been net paid.
        // findAll() is NOT tenant-scoped: the Hibernate filter is only switched on inside an HTTP
        // request, which is exactly why every revenue query writes its own organization predicate.
        // The cross-check has to narrow by hand.
        BigDecimal netPaidPerInvoice = myInvoices().stream()
                .map(Invoice::netPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(s.netCollected()).isEqualByComparingTo(netPaidPerInvoice);
    }

    @Test
    void methodAndCashierTotalsBothFootToTheCollectedTotal() {
        scenario();
        Summary s = service.summary(TODAY, null);

        BigDecimal byMethod = s.collections().byMethod().stream()
                .map(RevenueDtos.MethodTotal::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal byCashier = s.collections().byCashier().stream()
                .map(RevenueDtos.CashierTotal::amount).reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(byMethod).isEqualByComparingTo(s.collections().grossCollected());
        assertThat(byCashier).isEqualByComparingTo(s.collections().grossCollected());
        assertThat(s.collections().byMethod().stream().mapToLong(RevenueDtos.MethodTotal::transactions).sum())
                .isEqualTo(s.collections().paymentCount());
        // The gateway's verified payment is attributed to the provider, not to a person.
        assertThat(s.collections().byCashier()).anyMatch(c -> c.receivedBy().equals("system:ESEWA"));
    }

    @Test
    void aPackageIsBilledOnceAndItsMemberTestsAreNeverBilledSeparately() {
        Scenario sc = scenario();
        Breakdown b = service.breakdown(TODAY, null);

        TestRow pkg = b.byTest().stream().filter(t -> t.code().equals("PKG1")).findFirst().orElseThrow();
        assertThat(pkg.type()).isEqualTo(TestType.PROFILE);
        assertThat(pkg.timesOrdered()).isEqualTo(1);
        // The package's own price, net of the 10% invoice discount? No — line level is pre-invoice
        // discount, so the package line is its full 3000.
        assertThat(pkg.netBilled()).isEqualByComparingTo("3000.00");

        // CBC and LIPID appear only for the invoices that billed them DIRECTLY. The package's
        // members are performed but never invoiced, so they add nothing here.
        TestRow cbc = b.byTest().stream().filter(t -> t.code().equals("CBC")).findFirst().orElseThrow();
        TestRow lipid = b.byTest().stream().filter(t -> t.code().equals("LIPID")).findFirst().orElseThrow();
        // CBC is billed directly by invoices 1, 3 and 8 — not by the cancelled one, not by the
        // draft, and not by the package that contains it. LIPID by invoices 1, 3, 4 and 6.
        assertThat(cbc.timesOrdered()).isEqualTo(3);
        assertThat(lipid.timesOrdered()).isEqualTo(4);
        assertThat(sc.profile().effectiveTests()).hasSize(2); // the members exist, they are just not billed

        // Every per-test line sums to the invoice subtotal — never to total billed, since the
        // invoice-level discount and VAT are not distributed across lines.
        BigDecimal perTest = b.byTest().stream().map(TestRow::netBilled).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(perTest).isEqualByComparingTo(service.summary(TODAY, null).billing().subtotal());
    }

    @Test
    void categoryAndDepartmentRollUpsFootToTheTestTable() {
        scenario();
        Breakdown b = service.breakdown(TODAY, null);
        BigDecimal perTest = b.byTest().stream().map(TestRow::netBilled).reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(b.byCategory().stream().map(GroupRow::netBilled).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(perTest);
        assertThat(b.byDepartment().stream().map(GroupRow::netBilled).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(perTest);
        assertThat(b.byCategory()).extracting(GroupRow::label).contains("Hematology", "Biochemistry", "Packages");
        assertThat(b.byDepartment()).extracting(GroupRow::label).contains("Haematology", "Biochemistry");

        // Only the profile shows up as a package.
        assertThat(b.byPackage()).singleElement().extracting(GroupRow::label).isEqualTo("Full Body Checkup");
    }

    @Test
    void patientTypeAndPayerBreakdownsFootToTotalBilled() {
        scenario();
        Summary s = service.summary(TODAY, null);
        Breakdown b = service.breakdown(TODAY, null);

        assertThat(b.byPatientCategory().stream().map(RevenueDtos.PatientCategoryRow::billed)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo(s.billing().totalBilled());
        assertThat(b.byPayer().stream().map(RevenueDtos.PayerRow::billed)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo(s.billing().totalBilled());

        // The corporate account is identifiable and carries its on-account balance correctly.
        var acme = b.byPayer().stream().filter(r -> "Acme Industries".equals(r.payerName())).findFirst().orElseThrow();
        assertThat(acme.payerType()).isEqualTo(PayerType.CORPORATE);
        assertThat(acme.billed()).isEqualByComparingTo("1650.00");
        assertThat(acme.outstanding()).isEqualByComparingTo("0.00"); // settled on account
    }

    @Test
    void registersListExactlyTheTransactionsBehindTheTotals() {
        scenario();
        Summary s = service.summary(TODAY, null);

        var payments = service.payments(TODAY, null, null, null, 0, 100, null, false);
        assertThat(payments.totalElements()).isEqualTo(s.collections().paymentCount());
        assertThat(payments.content().stream().map(RevenueDtos.PaymentRow::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo(s.collections().grossCollected());
        // The partially refunded receipt is flagged with what came back off it.
        assertThat(payments.content()).anyMatch(p -> p.refundedAmount().compareTo(new BigDecimal("200.00")) == 0);

        var refundRows = service.refunds(TODAY, null, 0, 100, null, false);
        assertThat(refundRows.totalElements()).isEqualTo(2);
        assertThat(refundRows.content().stream().map(RevenueDtos.RefundRow::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo(s.refunds().amount());

        var open = service.outstanding(TODAY, null, RevenueDtos.OutstandingScope.PERIOD, 0, 100, null, false);
        assertThat(open.totalElements()).isEqualTo(s.billing().outstandingInvoiceCount());
        assertThat(open.content().stream().map(RevenueDtos.OutstandingRow::balance)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo(s.billing().outstanding());
    }

    @Test
    void theTrendSumsToThePeriodTotals() {
        scenario();
        Summary s = service.summary(TODAY, null);
        var trend = service.trend(TODAY, null, RevenueDtos.Granularity.DAY);

        assertThat(trend.points()).hasSize(1); // a one-day window
        assertThat(trend.points().stream().map(RevenueDtos.TrendPoint::billed).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(s.billing().totalBilled());
        assertThat(trend.points().stream().map(RevenueDtos.TrendPoint::collected).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(s.collections().grossCollected());
        assertThat(trend.points().stream().map(RevenueDtos.TrendPoint::refunded).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(s.refunds().amount());
    }

    @Test
    void theReportCarriesTheSameFiguresAsTheDashboard() {
        scenario();
        Summary dashboard = service.summary(TODAY, null);
        var report = service.report(TODAY, null);

        assertThat(report.summary().billing().totalBilled()).isEqualByComparingTo(dashboard.billing().totalBilled());
        assertThat(report.summary().collections().grossCollected()).isEqualByComparingTo(dashboard.collections().grossCollected());
        assertThat(report.summary().netCollected()).isEqualByComparingTo(dashboard.netCollected());
        assertThat(report.summary().billing().outstanding()).isEqualByComparingTo(dashboard.billing().outstanding());
        assertThat(report.payments().total()).isEqualTo(dashboard.collections().paymentCount());
        assertThat(report.payments().truncated()).isFalse();
        // And the printed register's own total matches the headline it is printed beneath.
        assertThat(report.payments().rows().stream().map(RevenueDtos.PaymentRow::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo(dashboard.collections().grossCollected());
    }

    @Test
    void anotherClinicsMoneyIsNeverVisible() {
        scenario();
        Summary mine = service.summary(TODAY, null);

        // A second organization with its own invoice, paid in full.
        Long otherOrg = organizations.save(Organization.create("other-" + System.nanoTime(), "Other Clinic")).getId();
        TenantContext.set(otherOrg);
        laboratoryProfiles.ensureProvisioned(otherOrg, "Other Clinic");
        Department d = departments.save(Department.create("OD", "Other Dept"));
        Branch otherBranch = branches.save(Branch.create("OB", "Other Branch"));
        LabTest t = test("OTHER", "Other Test", "9999.00", TestType.ANALYTE, d, "Other");
        Patient p = patient("Other Patient", PatientCategory.WALK_IN, PayerType.SELF, null);
        Invoice other = issued(p, otherBranch, DiscountType.NONE, null, null, t, null);
        other.recordPayment(new BigDecimal("9999.00"), PaymentMethod.CASH, "X-1", null, "other-cashier");
        invoices.saveAndFlush(other);

        Summary theirs = service.summary(TODAY, null);
        assertThat(theirs.billing().totalBilled()).isEqualByComparingTo("9999.00");
        assertThat(theirs.collections().grossCollected()).isEqualByComparingTo("9999.00");

        // Back in the first clinic, nothing has moved.
        TenantContext.set(orgId);
        Summary againstMine = service.summary(TODAY, null);
        assertThat(againstMine.billing().totalBilled()).isEqualByComparingTo(mine.billing().totalBilled());
        assertThat(againstMine.collections().grossCollected()).isEqualByComparingTo(mine.collections().grossCollected());
        assertThat(service.breakdown(TODAY, null).byTest()).noneMatch(r -> r.code().equals("OTHER"));
    }

    @Test
    void branchNarrowingKeepsTheFiguresConsistent() {
        Scenario sc = scenario();
        Summary all = service.summary(TODAY, null);
        Summary main = service.summary(TODAY, sc.main().getId());

        // Every invoice in the scenario is on the main branch, so narrowing changes nothing.
        assertThat(main.billing().totalBilled()).isEqualByComparingTo(all.billing().totalBilled());
        assertThat(main.collections().grossCollected()).isEqualByComparingTo(all.collections().grossCollected());

        // A branch with no activity reports zeroes, not nulls.
        Branch empty = branches.save(Branch.create("EMPTY", "Empty Branch"));
        Summary none = service.summary(TODAY, empty.getId());
        assertThat(none.billing().totalBilled()).isEqualByComparingTo("0.00");
        assertThat(none.collections().grossCollected()).isEqualByComparingTo("0.00");
        assertThat(none.refunds().amount()).isEqualByComparingTo("0.00");
        assertThat(none.billing().invoiceCount()).isZero();
    }

    @Test
    void aPeriodWithNoActivityReportsZeroesRatherThanFailing() {
        scenario();
        LocalDate longAgo = LocalDate.of(2021, 3, 1);
        Summary s = service.summary(new Range(longAgo, longAgo.plusDays(6)), null);

        assertThat(s.billing().totalBilled()).isEqualByComparingTo("0.00");
        assertThat(s.billing().grossCharges()).isEqualByComparingTo("0.00");
        assertThat(s.collections().grossCollected()).isEqualByComparingTo("0.00");
        assertThat(s.netCollected()).isEqualByComparingTo("0.00");
        assertThat(s.collections().byMethod()).isEmpty();
        assertThat(service.breakdown(new Range(longAgo, longAgo), null).byTest()).isEmpty();
        assertThat(service.trend(new Range(longAgo, longAgo.plusDays(6)), null, RevenueDtos.Granularity.DAY).points())
                .hasSize(7)
                .allMatch(p -> p.billed().signum() == 0 && p.collected().signum() == 0);

        // The all-time outstanding figure is a point-in-time measure and is NOT period-bound.
        assertThat(s.outstanding().amount()).isEqualByComparingTo("2400.00");
    }

    @Test
    void previousPeriodComparisonLooksAtTheWindowBeforeThisOne() {
        scenario();
        Summary s = service.summary(TODAY, null);

        assertThat(s.previous().period().from()).isEqualTo(TODAY.from().minusDays(1));
        assertThat(s.previous().period().to()).isEqualTo(TODAY.to().minusDays(1));
        // Everything in the fixture is stamped "now", so yesterday is empty.
        assertThat(s.previous().totalBilled()).isEqualByComparingTo("0.00");
        assertThat(s.previous().grossCollected()).isEqualByComparingTo("0.00");
    }

    @Test
    void anInvoiceIsNeverCountedOncePerPaymentOrOncePerLine() {
        scenario();
        Summary s = service.summary(TODAY, null);
        List<Invoice> all = myInvoices();

        // The package invoice has two payments and the first invoice has two lines. If either join
        // fanned out, these two independent sums would disagree with the aggregate.
        BigDecimal issuedTotal = all.stream()
                .filter(i -> i.getStatus() == np.com.lims.billing.entity.InvoiceStatus.ISSUED)
                .map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(s.billing().totalBilled()).isEqualByComparingTo(issuedTotal);

        BigDecimal issuedSubtotal = all.stream()
                .filter(i -> i.getStatus() == np.com.lims.billing.entity.InvoiceStatus.ISSUED)
                .map(Invoice::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(s.billing().subtotal()).isEqualByComparingTo(issuedSubtotal);
        assertThat(s.billing().invoiceCount()).isEqualTo(
                all.stream().filter(i -> i.getStatus() == np.com.lims.billing.entity.InvoiceStatus.ISSUED).count());
    }
}
