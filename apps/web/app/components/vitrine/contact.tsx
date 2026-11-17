import { Artwork } from './artwork';

export function Contact({ email }: { email: string | null }) {
  return (
    <section
      className="vitrine-contact"
      id="contact"
      aria-labelledby="contact-title"
    >
      <h2 id="contact-title">
        <Artwork
          file="IllustrationSansTitre562.png"
          width={746}
          height={340}
          alt="Contact"
        />
      </h2>
      <div className="vitrine-contact-invitation">
        <Artwork
          file="IllustrationSansTitre611.png"
          width={416}
          height={109}
          alt="On en discute ?"
        />
      </div>
      <form
        className="vitrine-contact-form"
        action={email ? `mailto:${email}` : undefined}
        method="post"
        encType="text/plain"
        aria-describedby="contact-help"
      >
        <label htmlFor="contact-nom">Nom</label>
        <input
          id="contact-nom"
          name="nom"
          autoComplete="family-name"
          required
          maxLength={100}
        />
        <label htmlFor="contact-prenom">Prénom</label>
        <input
          id="contact-prenom"
          name="prenom"
          autoComplete="given-name"
          required
          maxLength={100}
        />
        <label htmlFor="contact-demande">Demande</label>
        <textarea
          id="contact-demande"
          name="demande"
          required
          maxLength={5000}
          rows={4}
        />
        <div className="vitrine-contact-send">
          <p id="contact-help">
            {email
              ? 'Votre messagerie s’ouvrira avec votre demande. Vous pourrez la relire avant de l’envoyer.'
              : 'L’envoi sera disponible dès que l’adresse de contact sera renseignée.'}
          </p>
          <button type="submit" disabled={!email}>
            Parlons de votre projet ↗
          </button>
        </div>
      </form>
      <footer className="vitrine-footer">
        <Artwork file="LogoEpicc.png" width={256} height={189} alt="EPICC" />
        <a href="#prestations">Lancement de marque</a>
        <a href="#prestations">Stratégie de communication</a>
        <a href="#contenu">Retour en haut ↑</a>
      </footer>
    </section>
  );
}
