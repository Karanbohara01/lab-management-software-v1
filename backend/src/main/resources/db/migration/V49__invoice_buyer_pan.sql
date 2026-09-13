-- The buyer/purchaser's own PAN — already accepted by the IRD e-billing payload
-- (IrdBillPayload.buyerPan) but never actually populated (always sent blank); this column is
-- where it's now entered and stored, feeding both the printed invoice and the real CBMS submission.
ALTER TABLE invoice ADD COLUMN buyer_pan VARCHAR(20) NULL AFTER notes;
