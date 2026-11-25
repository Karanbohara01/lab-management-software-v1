package np.com.lims.pharmacy.service;

import np.com.lims.pharmacy.dto.PharmacyDtos.PharmacyDashboardStats;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.entity.PharmacySale;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import np.com.lims.pharmacy.repository.PharmacySaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PharmacyDashboardService {

    private static final ZoneId KATHMANDU = ZoneId.of("Asia/Kathmandu");

    private final PharmacyItemRepository itemRepository;
    private final PharmacyBatchRepository batchRepository;
    private final PharmacySaleRepository saleRepository;

    public PharmacyDashboardService(PharmacyItemRepository itemRepository,
                                    PharmacyBatchRepository batchRepository,
                                    PharmacySaleRepository saleRepository) {
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
        this.saleRepository = saleRepository;
    }

    @Transactional(readOnly = true)
    public PharmacyDashboardStats getStats() {
        LocalDate today = LocalDate.now(KATHMANDU);
        Instant startOfToday = today.atStartOfDay(KATHMANDU).toInstant();
        Instant endOfToday = today.plusDays(1).atStartOfDay(KATHMANDU).toInstant();
        Instant startOfMonth = today.withDayOfMonth(1).atStartOfDay(KATHMANDU).toInstant();

        List<PharmacyItem> items = itemRepository.findAll().stream()
                .filter(PharmacyItem::getIsActive)
                .toList();
        long totalMedicines = items.size();

        List<PharmacyBatch> batches = batchRepository.findAll().stream()
                .filter(b -> b.getIsActive() && b.hasStock())
                .toList();

        Map<Long, Integer> stockByItem = batches.stream()
                .collect(Collectors.groupingBy(b -> b.getItem().getId(), Collectors.summingInt(PharmacyBatch::getRemainingUnits)));

        long lowStockCount = items.stream()
                .filter(item -> {
                    int stock = stockByItem.getOrDefault(item.getId(), 0);
                    int min = item.getMinStockLevel() != null ? item.getMinStockLevel() : 10;
                    return stock <= min;
                })
                .count();

        long expiredCount = batches.stream()
                .filter(b -> b.isExpired(today))
                .count();

        long expiringIn30DaysCount = batches.stream()
                .filter(b -> b.isExpiringWithin(today, 30))
                .count();

        List<PharmacySale> todaySales = saleRepository.findSalesBetween(startOfToday, endOfToday);
        long todaySalesCount = todaySales.size();
        BigDecimal todaySalesAmount = todaySales.stream()
                .map(PharmacySale::getNetTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PharmacySale> monthSales = saleRepository.findSalesBetween(startOfMonth, endOfToday);
        BigDecimal monthSalesAmount = monthSales.stream()
                .map(PharmacySale::getNetTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PharmacyDashboardStats(
                totalMedicines,
                lowStockCount,
                expiringIn30DaysCount,
                expiredCount,
                todaySalesCount,
                todaySalesAmount,
                monthSalesAmount
        );
    }
}
