import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Casa Chefs</h1>
      <p className="max-w-md text-muted-foreground">
        Catering, box lunches, and made-to-order frozen food in Houston, The Woodlands, and Magnolia, TX.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/order" />}>
          Start an order
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/account" />}>
          My account
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/login" />}>
          Staff &amp; admin sign in
        </Button>
      </div>
    </div>
  );
}
