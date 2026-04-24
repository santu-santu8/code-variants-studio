import { Link, useLocation } from "wouter";
import { Terminal, Database, Code2 } from "lucide-react";
import { ThemeProvider } from "./theme-provider";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isStudio = location === "/" || location === "";
  const isBlog = location.startsWith("/blog");

  return (
    <ThemeProvider>
      <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30 dark">
        <header className="h-14 border-b border-border/40 flex items-center px-6 shrink-0 bg-background/95 backdrop-blur z-50 sticky top-0">
          <div className="flex items-center gap-2 font-mono font-bold text-primary mr-8 tracking-tight">
            <Terminal className="w-5 h-5" />
            <span>Code_Variants</span>
          </div>

          <nav className="flex items-center gap-6 text-sm font-mono tracking-tight">
            <Link
              href="/"
              className={`flex items-center gap-2 transition-colors hover:text-primary ${
                isStudio ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Studio</span>
            </Link>
            <Link
              href="/blog"
              className={`flex items-center gap-2 transition-colors hover:text-primary ${
                isBlog ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Techniques</span>
            </Link>
          </nav>
        </header>

        <main className="flex-1 flex flex-col relative w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
