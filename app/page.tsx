import Link from "next/link"
import { Receipt, Users, Calculator, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SplitBD</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Split Expenses with Friends, Simplified
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Stop the awkward money conversations. SplitBD makes it easy to track shared expenses, 
            calculate who owes what, and settle up with friends and family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Splitting Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-base font-medium text-foreground hover:bg-muted transition-colors"
            >
              I Have an Account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Create Groups</h3>
            <p className="text-muted-foreground">
              Create groups for trips, roommates, or any shared expenses. Invite friends with a simple code.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Track Expenses</h3>
            <p className="text-muted-foreground">
              Add expenses with flexible splitting. Split equally, by percentage, or custom amounts.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Settle Up</h3>
            <p className="text-muted-foreground">
              See who owes what at a glance. Optimized settlements mean fewer transactions.
            </p>
          </div>
        </div>

        {/* Designed for BD */}
        <div className="mt-24 text-center">
          <p className="text-lg text-muted-foreground">
            Designed for Bangladesh with <span className="text-primary font-semibold">৳ BDT</span> support
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          Built with care for splitting expenses fairly
        </p>
      </footer>
    </div>
  )
}
