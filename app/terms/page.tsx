import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) — FarWane",
  description: "Conditions Générales d'Utilisation, mentions légales et règles de contenu de FarWane",
}

const CONTACT_EMAIL = "contact@farwane.app"

export default function TermsPage() {
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
            <div className="w-10 h-10 rounded-xl border-2 border-accent bg-accent/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Conditions Générales d&apos;Utilisation (CGU)</h1>
              <p className="text-xs text-muted-foreground">Dernière mise à jour : novembre 2026</p>
            </div>
          </div>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">1. Mentions légales (LCEN)</h2>
            <p>
              L&apos;application et le site <strong>FarWane</strong> sont édités par une entreprise
              individuelle immatriculée en France au Registre National des Entreprises (INPI).
              Conformément à l&apos;article 6-III-2 de la loi n° 2004-575 du 21 juin 2004 (LCEN), les
              coordonnées personnelles complètes de l&apos;éditeur ont été transmises à l&apos;hébergeur.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contact :</strong> <span className="text-foreground">{CONTACT_EMAIL}</span></li>
              <li><strong>Hébergement web :</strong> Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, USA.</li>
              <li><strong>Infrastructure base de données :</strong> Supabase, Inc., 970 Toa Payoh North, Singapour / UE.</li>
            </ul>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">2. Accès au jeu & Âge minimum</h2>
            <p>
              FarWane est un jeu multijoueur en ligne de création de légendes humoristiques entre
              amis dans des salons privés accessibles par code. L&apos;utilisation du jeu et la création
              d&apos;un compte sont réservées aux personnes âgées d&apos;au moins <strong>13 ans</strong> (ou
              disposant de l&apos;autorisation d&apos;un représentant légal pour les mineurs selon la
              législation de leur pays de résidence).
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">3. Propriété intellectuelle & Licence sur le contenu des joueurs</h2>
            <p>
              Le code source, la marque FarWane, le logo, l&apos;interface graphique et les mini-jeux
              intégrés sont la propriété exclusive de l&apos;éditeur.
            </p>
            <p>
              Lorsque vous soumettez des légendes, thèmes, avatars ou collections d&apos;images dans le
              cadre d&apos;une partie, vous conservez vos droits sur vos contenus et accordez à FarWane
              une <strong>licence gratuite, non exclusive et mondiale</strong> permettant uniquement
              de reproduire, afficher et transmettre ce contenu aux participants de votre salon et
              dans votre espace personnel (favoris / Bangers) pour le fonctionnement du jeu.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">4. Contenu généré par les joueurs (UGC) & Modération</h2>
            <p>
              Les joueurs sont seuls responsables des légendes, messages de chat, thèmes, avatars
              et liens de collections personnelles qu&apos;ils partagent pendant leurs parties.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Aucun contenu illicite, diffamatoire, haineux, discriminatoire, harcelant ou portant atteinte aux droits d&apos;autrui n&apos;est autorisé.</li>
              <li>L&apos;éditeur se réserve le droit de supprimer tout contenu signalé comme illicite et de suspendre ou supprimer sans préavis tout compte enfreignant les présentes CGU.</li>
              <li>Tout abus peut être signalé à l&apos;adresse <strong className="text-foreground">{CONTACT_EMAIL}</strong>.</li>
            </ul>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">5. Disponibilité & Limitation de responsabilité</h2>
            <p>
              FarWane est fourni « en l&apos;état » et nécessite une connexion Internet active.
              L&apos;éditeur ne saurait être tenu responsable des interruptions temporaires de serveur,
              de la perte éventuelle de données de partie, ni des propos ou contenus échangés par
              les utilisateurs au sein de leurs salons privés.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-black text-foreground">6. Droit applicable & Juridiction</h2>
            <p>
              Les présentes CGU sont régies par le <strong>droit français</strong>. En cas de
              litige et à défaut de résolution amiable, les tribunaux français seront seuls
              compétents.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
