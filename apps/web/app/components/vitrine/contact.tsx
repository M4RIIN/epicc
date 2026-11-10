import type { FormEvent } from 'react';
import { Artwork } from './artwork';

export function Contact({ email }: { email: string | null }) {
  function composeMessage(event: FormEvent<HTMLFormElement>) {
    if (!email) return;
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = `Une collaboration avec ${data.get('prenom')} ${data.get('nom')}`;
    const body = `Nom : ${data.get('nom')}\nPrénom : ${data.get('prenom')}\n\n${data.get('demande')}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

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
        onSubmit={composeMessage}
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
        <a href="#prestations">Lancement de marque</a>
        <a href="#prestations">Stratégie de communication</a>
        <a href="#contenu">Retour en haut ↑</a>
      </footer>
    </section>
  );
}
