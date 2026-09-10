import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  muted: { color: "#666666" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#cccccc", marginVertical: 8 },
  total: { fontSize: 13, fontWeight: 700 },
  badge: { fontSize: 10, color: "#666666", marginTop: 2 },
});

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface QuotePdfData {
  version: number;
  customerName: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  foodSubtotalCents: number;
  addonsSubtotalCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  surchargeCents: number;
  discountSurchargeReason: string | null;
  grandTotalCents: number;
  customerNotes: string | null;
  approval?: { signatureName: string; approvedAt: string } | null;
}

export function QuoteDocument({ data }: { data: QuotePdfData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h1}>Casa Chefs</Text>
        <Text style={styles.muted}>Quote v{data.version}</Text>

        <View style={styles.divider} />

        <Text style={styles.h2}>Event</Text>
        <View style={styles.row}>
          <Text>Customer</Text>
          <Text>{data.customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text>Date &amp; time</Text>
          <Text>
            {data.eventDate} at {data.eventTime}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>Guests</Text>
          <Text>{data.guestCount}</Text>
        </View>

        <Text style={styles.h2}>Pricing</Text>
        <View style={styles.row}>
          <Text>Food subtotal</Text>
          <Text>{money(data.foodSubtotalCents)}</Text>
        </View>
        {data.addonsSubtotalCents > 0 && (
          <View style={styles.row}>
            <Text>Add-ons</Text>
            <Text>{money(data.addonsSubtotalCents)}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text>Delivery</Text>
          <Text>{money(data.deliveryFeeCents)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Gratuity</Text>
          <Text>{money(data.tipCents)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Tax</Text>
          <Text>{money(data.taxCents)}</Text>
        </View>
        {data.discountCents > 0 && (
          <View style={styles.row}>
            <Text>Discount{data.discountSurchargeReason ? ` (${data.discountSurchargeReason})` : ""}</Text>
            <Text>-{money(data.discountCents)}</Text>
          </View>
        )}
        {data.surchargeCents > 0 && (
          <View style={styles.row}>
            <Text>Surcharge{data.discountSurchargeReason ? ` (${data.discountSurchargeReason})` : ""}</Text>
            <Text>{money(data.surchargeCents)}</Text>
          </View>
        )}

        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.total}>Grand total</Text>
          <Text style={styles.total}>{money(data.grandTotalCents)}</Text>
        </View>

        {data.customerNotes && (
          <>
            <Text style={styles.h2}>Notes</Text>
            <Text>{data.customerNotes}</Text>
          </>
        )}

        {data.approval && (
          <>
            <Text style={styles.h2}>Approval</Text>
            <View style={styles.row}>
              <Text>Signed by</Text>
              <Text>{data.approval.signatureName}</Text>
            </View>
            <View style={styles.row}>
              <Text>Approved</Text>
              <Text>{data.approval.approvedAt}</Text>
            </View>
          </>
        )}
      </Page>
    </Document>
  );
}
