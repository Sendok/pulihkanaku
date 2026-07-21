export type PaymentQuote = {
  workerPayable: number;
  platformFee: number;
  providerFee: number;
  invoiceTotal: number;
  currency: "IDR";
};

export function calculatePaymentQuote(workerPayable: number, platformFeeRate = 0.1, providerFeeRate = 0.01): PaymentQuote {
  if (!Number.isSafeInteger(workerPayable) || workerPayable < 10_000) throw new RangeError("Nominal pekerja tidak valid.");
  if (platformFeeRate < 0 || platformFeeRate > 1 || providerFeeRate < 0 || providerFeeRate > 1) throw new RangeError("Tarif biaya tidak valid.");
  const platformFee = Math.round(workerPayable * platformFeeRate);
  const providerFee = Math.round((workerPayable + platformFee) * providerFeeRate);
  return { workerPayable, platformFee, providerFee, invoiceTotal: workerPayable + platformFee + providerFee, currency: "IDR" };
}
