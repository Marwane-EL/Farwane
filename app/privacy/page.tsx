import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

export const metadata = {
  title: "Politique de confidentialité (RGPD) — FarWane",
  description: "Politique de confidentialité et protection des données personnelles (RGPD) de FarWane",
}

const CONTACT_EMAIL = "contact@farwane.app"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à FarWane
        </Link>

        <div className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8 shadow-[5px_5px_0px_var(--border)] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border-2 border-primary bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Politique de confidentialité (RGPD)</h1>
              <p className="text-xs text-muted-foreground">Dernière mise à jour : novembre 2026</p>
            </div>
          </div>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles collectées sur FarWane est
              l&apos;éditeur de l&apos;application FarWane (entreprise individuelle immatriculée en France).
              Pour toute question relative à vos données personnelles, vous pouvez nous contacter à
              l&apos;adresse : <strong className="text-foreground">{CONTACT_EMAIL}</strong>.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">2. Données collectées & Bases légales</h2>
            <p>
              FarWane est jouable sans création de compte (mode invité). Lorsque vous choisissez de
              créer un compte utilisateur, nous traitons les données suivantes sur la base de
              l&apos;<strong>exécution du contrat</strong> (fourniture des fonctionnalités de compte) et de
              votre <strong>consentement</strong> :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse email et mot de passe chiffré (authentification via Supabase Auth).</li>
              <li>Pseudo, avatar choisi ou image de profil compressée.</li>
              <li>Mèmes favoris, Bangers sauvegardés (Hall of Fame), thèmes (niches) et collections personnelles.</li>
              <li>Statistiques de jeu (parties jouées, victoires, points totaux, coups de cœur reçus).</li>
            </ul>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">3. Durée de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Salons de jeu, soumissions et chat en direct :</strong> données strictement
                éphémères transitant en temps réel (Supabase Realtime), non conservées après la fin
                de la partie.
              </li>
              <li>
                <strong>Données de compte :</strong> conservées tant que votre compte reste actif,
                ou supprimées après 24 mois d&apos;inactivité continue (ou immédiatement sur simple
                demande de suppression).
              </li>
            </ul>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">4. Stockage local (LocalStorage & SessionStorage)</h2>
            <p>
              L&apos;application utilise uniquement le stockage local technique de votre navigateur ou
              client desktop (<code>localStorage</code> et <code>sessionStorage</code>) pour
              maintenir votre session de jeu en cours, vos préférences et le cache média. Aucun
              cookie publicitaire ni traceur tiers de profilage n&apos;est utilisé.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">5. Sous-traitants & Hébergement</h2>
            <p>
              Vos données ne sont jamais vendues ni cédées à des tiers. Elles sont hébergées auprès
              de prestataires techniques conformes au RGPD (clauses contractuelles types de la
              Commission européenne lorsque des serveurs sont situés hors UE) :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase Inc.</strong> : base de données, authentification et salons temps réel.</li>
              <li><strong>Netlify Inc. / Vercel Inc.</strong> : hébergement de l&apos;application web et mesures d&apos;audience anonymisées.</li>
              <li><strong>jsDelivr (ProspectOne)</strong> : réseau de diffusion de contenu (CDN) pour les médias par défaut.</li>
            </ul>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">6. Vos droits RGPD & Réclamation CNIL</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
              d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement,
              d&apos;opposition et de portabilité de vos données.
            </p>
            <p>
              Pour exercer ces droits ou demander la suppression complète de votre compte, écrivez à{" "}
              <strong className="text-foreground">{CONTACT_EMAIL}</strong>. Vous disposez également
              du droit d&apos;introduire une réclamation auprès de l&apos;autorité de contrôle compétente
              (la <strong>CNIL</strong> en France — <code>www.cnil.fr</code>).
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
