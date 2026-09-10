import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  muted: { color: "#666666" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#cccccc", marginVertical: 8 },
  alertBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  alertTitle: { color: "#dc2626", fontWeight: 700, marginBottom: 4 },
  alertLine: { color: "#dc2626" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: "#eeeeee" },
});

export interface BeoAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
}

export interface BeoPdfData {
  customerName: string;
  companyName: string | null;
  customerPhone: string;
  eventDate: string;
  eventTime: string;
  deliveryWindow: string | null;
  driverNotes: string | null;
  guestCount: number;
  address: BeoAddress | null;
  allergyAlerts: string[];
  items: { nameEn: string; quantity: number }[];
}

export function BeoDocument({ data }: { data: BeoPdfData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h1}>Casa Chefs — Kitchen / BEO Sheet</Text>
        <Text style={styles.muted}>
          {data.eventDate} at {data.eventTime}
        </Text>

        {data.allergyAlerts.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>ALLERGY / DIETARY ALERTS</Text>
            {data.allergyAlerts.map((alert, i) => (
              <Text key={i} style={styles.alertLine}>
                {alert}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.h2}>Event details</Text>
        <View style={styles.row}>
          <Text>Customer</Text>
          <Text>
            {data.customerName}
            {data.companyName ? ` (${data.companyName})` : ""}
          </Text>
        </View>
        <View style={styles.row}>
          <Text>Contact phone</Text>
          <Text>{data.customerPhone}</Text>
        </View>
        <View style={styles.row}>
          <Text>Guest count</Text>
          <Text>{data.guestCount}</Text>
        </View>
        {data.address && (
          <View style={styles.row}>
            <Text>Delivery address</Text>
            <Text>
              {data.address.line1}
              {data.address.line2 ? `, ${data.address.line2}` : ""}, {data.address.city}, {data.address.state}{" "}
              {data.address.zip}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text>Delivery window</Text>
          <Text>{data.deliveryWindow ?? "—"}</Text>
        </View>
        {data.driverNotes && (
          <View style={styles.row}>
            <Text>Driver notes</Text>
            <Text>{data.driverNotes}</Text>
          </View>
        )}

        <Text style={styles.h2}>Packing list / item counts</Text>
        {data.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text>{item.nameEn}</Text>
            <Text>× {item.quantity}</Text>
          </View>
        ))}
        {data.items.length === 0 && <Text style={styles.muted}>No items.</Text>}
      </Page>
    </Document>
  );
}
