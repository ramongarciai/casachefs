import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No orders yet. The order pipeline will appear here once the
          customer wizard and admin review workspace are built.
        </CardContent>
      </Card>
    </div>
  );
}
