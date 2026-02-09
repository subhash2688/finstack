import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Lighthouse</span>
        </Link>
        <nav className="flex items-center space-x-6">
          <Link
            href="/ap"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Accounts Payable
          </Link>
          <Link
            href="/engagements"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Engagements
          </Link>
          <Link
            href="/#coming-soon"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            FP&A
          </Link>
          <Link
            href="/#coming-soon"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Close
          </Link>
        </nav>
      </div>
    </header>
  );
}
