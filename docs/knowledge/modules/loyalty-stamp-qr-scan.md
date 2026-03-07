# Module: LoyaltyStampQrScan

## Model

- **File:** `backend/app/Models/LoyaltyStampQrScan.php`
- **Table:** `loyalty_stamp_qr_scans`
- **Timestamps:** Disabled (`$timestamps = false`)
- **Fillable:** `qr_code_id`, `customer_id`, `scanned_at`
- **Relationships:**
  - `qrCode()` — BelongsTo `LoyaltyStampQrCode`
  - `customer()` — BelongsTo `Customer`
- **Casts:** `scanned_at` → datetime

## Purpose

Lightweight tracking model for **daily mode** QR code scans only. Records that a specific customer has scanned a specific daily QR code, preventing duplicate scans of the same daily code.

## Key Constraints

- Unique constraint on `(qr_code_id, customer_id)` — each customer can only scan a given daily QR code once
- Only used for `daily` mode QR codes; `single_use` mode QR codes are deactivated after first scan and don't need this table

## How It Fits

1. Customer scans a daily QR code
2. `LoyaltyStampQrScan` record is created to track the scan
3. A `LoyaltyStamp` is created for the customer's loyalty card
4. The stamp count is checked against tier thresholds for reward eligibility

## Gotchas / Notes

- No dedicated controller, resource, DTO, or repository — managed entirely through `LoyaltyStampQrCodeService`
- The primary deduplication mechanism for stamp granting actually checks `LoyaltyStamp` records (one stamp per card per day), not this table. This table prevents the same daily QR from being scanned twice by the same customer, while the stamp dedup prevents earning multiple stamps in one day regardless of QR code.
- No timestamps columns — only `scanned_at` is tracked (set at creation time)
