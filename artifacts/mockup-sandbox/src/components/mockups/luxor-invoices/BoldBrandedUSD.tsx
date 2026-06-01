import { InvoiceTemplate, USA_INVOICE } from "./InvoiceTemplate";

export function BoldBrandedUSD() {
  return <InvoiceTemplate data={USA_INVOICE} />;
}
