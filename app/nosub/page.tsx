import PricingTableThreeNoSub from '@/components/pricing-table-three-nosub'
import NoSubSync from '@/components/nosub-sync'

export const metadata = {
  title: 'Ingen abonnement',
}

export default function NoSubPage() {
  return (
    <main className="min-h-screen flex items-start justify-center py-16 px-4">
      <NoSubSync />
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-semibold mb-4 text-center">Ingen aktivt abonnement</h1>
        <p className="text-center text-muted-foreground mb-6">Oppgrader for å få tilgang til alle funksjoner.</p>
        <PricingTableThreeNoSub />
      </div>
    </main>
  )
}
