import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FrozenFoodPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 items-center justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Frozen food, coming soon</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            Our made-to-order frozen food catalog is on its way. In the meantime, give us a call and we&apos;ll get
            you taken care of.
          </p>
          <Button render={<Link href="/order" />}>Back to start</Button>
        </CardContent>
      </Card>
    </div>
  );
}
