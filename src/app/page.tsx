import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Casa Chefs</h1>
      <p className="max-w-md text-muted-foreground">
        The ordering wizard is under construction. Check back soon.
      </p>
      <Button render={<Link href="/login" />}>Staff &amp; admin sign in</Button>
    </div>
  );
}
