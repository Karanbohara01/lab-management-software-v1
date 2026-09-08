package np.com.lims.patient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import org.springframework.util.StringUtils;

/** Structured address. Follows the Nepal hierarchy (province → district → local level → ward → tole). */
@Embeddable
public class Address {

    @Column(name = "address_line", length = 200)
    private String line;

    /** Legacy free-text locality. Retained for older records; new data uses {@link #municipality}. */
    @Column(length = 100)
    private String city;

    @Column(length = 120)
    private String municipality;

    @Column(name = "ward_no", length = 8)
    private String wardNo;

    @Column(length = 120)
    private String tole;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String province;

    @Column(length = 60)
    private String country;

    public Address() {
    }

    public Address(String line, String city, String municipality, String wardNo, String tole,
                   String district, String province, String country) {
        this.line = line;
        this.city = city;
        this.municipality = municipality;
        this.wardNo = wardNo;
        this.tole = tole;
        this.district = district;
        this.province = province;
        this.country = country;
    }

    public boolean isEmpty() {
        return !StringUtils.hasText(line) && !StringUtils.hasText(city) && !StringUtils.hasText(municipality)
                && !StringUtils.hasText(wardNo) && !StringUtils.hasText(tole) && !StringUtils.hasText(district)
                && !StringUtils.hasText(province) && !StringUtils.hasText(country);
    }

    public String getLine() {
        return line;
    }

    public String getCity() {
        return city;
    }

    public String getMunicipality() {
        return municipality;
    }

    public String getWardNo() {
        return wardNo;
    }

    public String getTole() {
        return tole;
    }

    public String getDistrict() {
        return district;
    }

    public String getProvince() {
        return province;
    }

    public String getCountry() {
        return country;
    }
}
