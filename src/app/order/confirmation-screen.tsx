import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ConfirmationScreen({ orderId }: { orderId: string }) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="font-heading">Request received</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>
          Thanks! This is a preliminary request, not a confirmed order — our team will review it and follow up
          with a formal quote.
        </p>
        <p>We&apos;ve also emailed you a sign-in link so you can check back on this request any time.</p>
        <p className="text-xs">Reference: {orderId}</p>
        <Button nativeButton={false} size="sm" render={<Link href="/account" />} className="self-start">
          View my orders
        </Button>
      </CardContent>
    </Card>
  );
}
