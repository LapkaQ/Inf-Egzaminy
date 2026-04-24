import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config'

const GRAD = 'bg-gradient-to-br from-accent to-accent-2'
const GRAD_TEXT = `${GRAD} bg-clip-text text-transparent`
const LABEL =
  'text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-accent'

const useReveal = () => {
  const ref = useRef(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        }),
      { threshold: 0.06 },
    )
    root
      .querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return ref
}

const SECTIONS = [
  {
    id: 'administrator',
    title: '1. Administrator danych osobowych',
    content: `Administratorem Twoich danych osobowych jest Wojciech Gawryluk, prowadzący serwis inf-egzaminy.pl („Platforma"), z siedzibą pod adresem: ul. Wierzbowa 3a/1, 15-743 Białystok. Wszelkie pytania dotyczące przetwarzania danych osobowych można kierować na adres e-mail: kontakt@inf-egzaminy.pl.`,
  },
  {
    id: 'zakres',
    title: '2. Zakres zbieranych danych',
    content: `W ramach korzystania z Platformy zbieramy następujące dane osobowe:`,
    list: [
      'Imię i nazwisko — w celu identyfikacji użytkownika',
      'Adres e-mail — w celu komunikacji, weryfikacji konta i odzyskiwania hasła',
      'Hasło (w formie zaszyfrowanej) — w celu zabezpieczenia dostępu do konta',
      'Rola w systemie (uczeń/korepetytor) — w celu dostosowania funkcjonalności',
      'Dane dotyczące rezerwacji lekcji — daty, godziny, przedmiot, powiązani użytkownicy',
      'Opinie i oceny — w celu budowania systemu reputacji korepetytorów',
      'Adres IP i dane techniczne przeglądarki — w celach bezpieczeństwa i diagnostyki',
    ],
  },
  {
    id: 'cel',
    title: '3. Cel przetwarzania danych',
    content: `Twoje dane osobowe przetwarzamy w następujących celach:`,
    list: [
      'Rejestracja i obsługa konta użytkownika',
      'Umożliwienie rezerwacji i zarządzania lekcjami',
      'Komunikacja z użytkownikiem (powiadomienia, e-maile systemowe)',
      'Weryfikacja adresu e-mail i odzyskiwanie hasła',
      'Zapewnienie bezpieczeństwa Platformy i zapobieganie nadużyciom',
      'Wyświetlanie statystyk i opinii na profilach korepetytorów',
      'Doskonalenie Platformy na podstawie anonimowych danych analitycznych',
    ],
  },
  {
    id: 'podstawa',
    title: '4. Podstawa prawna przetwarzania',
    content: `Dane osobowe przetwarzamy na podstawie:`,
    list: [
      'Art. 6 ust. 1 lit. a RODO — zgoda użytkownika (rejestracja konta)',
      'Art. 6 ust. 1 lit. b RODO — wykonanie umowy (świadczenie usług Platformy)',
      'Art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes administratora (bezpieczeństwo, analityka)',
    ],
  },
  {
    id: 'przechowywanie',
    title: '5. Okres przechowywania danych',
    content: `Dane osobowe przechowujemy przez okres niezbędny do realizacji celów, dla których zostały zebrane. Dane konta są przechowywane do momentu usunięcia konta przez użytkownika. Po usunięciu konta dane zostają trwale usunięte z naszych systemów w ciągu 30 dni, chyba że obowiązek ich dłuższego przechowywania wynika z przepisów prawa.`,
  },
  {
    id: 'prawa',
    title: '6. Twoje prawa',
    content: `Zgodnie z RODO przysługują Ci następujące prawa:`,
    list: [
      'Prawo dostępu do swoich danych osobowych',
      'Prawo do sprostowania (poprawienia) danych',
      'Prawo do usunięcia danych („prawo do bycia zapomnianym")',
      'Prawo do ograniczenia przetwarzania',
      'Prawo do przenoszenia danych',
      'Prawo do wniesienia sprzeciwu wobec przetwarzania',
      'Prawo do cofnięcia zgody w dowolnym momencie',
      'Prawo do wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO)',
    ],
    footer:
      'W celu realizacji powyższych praw skontaktuj się z nami pod adresem: kontakt@inf-egzaminy.pl.',
  },
  {
    id: 'udostepnianie',
    title: '7. Udostępnianie danych',
    content: `Twoje dane osobowe nie są sprzedawane ani udostępniane podmiotom trzecim w celach marketingowych. Dane mogą być udostępniane wyłącznie:`,
    list: [
      'Dostawcom usług hostingowych i infrastruktury serwerowej',
      'Dostawcom usług e-mail (do wysyłki powiadomień systemowych)',
      'Organom państwowym — wyłącznie na podstawie obowiązujących przepisów prawa',
    ],
  },
  {
    id: 'bezpieczenstwo',
    title: '8. Bezpieczeństwo danych',
    content: `Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych osobowych, w tym:`,
    list: [
      'Szyfrowanie haseł za pomocą algorytmów kryptograficznych (bcrypt)',
      'Komunikacja z serwerem zabezpieczona protokołem HTTPS/TLS',
      'Tokeny JWT z ograniczonym czasem ważności do uwierzytelniania sesji',
      'Ograniczony dostęp do bazy danych wyłącznie dla autoryzowanych systemów',
    ],
  },
  {
    id: 'cookies',
    title: '9. Pliki cookies',
    content: `Platforma wykorzystuje pliki cookies w celach technicznych (utrzymanie sesji użytkownika) i analitycznych. Możesz zarządzać ustawieniami cookies w swojej przeglądarce. Wyłączenie cookies może ograniczyć niektóre funkcjonalności Platformy.`,
  },
  {
    id: 'zmiany',
    title: '10. Zmiany w polityce prywatności',
    content: `Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. O istotnych zmianach będziemy informować poprzez powiadomienie na Platformie lub wiadomość e-mail. Aktualna wersja Polityki Prywatności jest zawsze dostępna na stronie inf-egzaminy.pl/privacy-policy.`,
  },
]

export const PrivacyPolicy = () => {
  const ref = useReveal()

  return (
    <div ref={ref} className="bg-page text-white min-h-screen">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-[140px] pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="hero-grid" />
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.15)_0%,transparent_70%)] blur-[40px]" />
        </div>

        <div className="max-w-4xl mx-auto px-8 relative z-10">
          <div className="reveal text-center">
            <div className={`${LABEL} mb-4`}>Informacje prawne</div>
            <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.1] mb-5">
              Polityka{' '}
              <span className={GRAD_TEXT}>Prywatności</span>
            </h1>
            <p className="text-subtle text-[1.05rem] max-w-[560px] mx-auto leading-[1.7]">
              Dbamy o Twoje dane osobowe. Poniżej znajdziesz szczegółowe
              informacje o tym, jak je zbieramy, przetwarzamy i chronimy.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-line-hi to-transparent" />

      {/* ── TABLE OF CONTENTS ────────────────────────────────────────────── */}
      <section className="py-12 max-w-4xl mx-auto px-8">
        <div className="reveal">
          <div className="bg-surface border border-line rounded-2xl p-7">
            <div className="text-[0.78rem] font-bold text-white uppercase tracking-[0.06em] mb-4">
              Spis treści
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-[0.87rem] text-subtle hover:text-white transition-colors duration-200 py-1"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTIONS ─────────────────────────────────────────────────────── */}
      <section className="pb-24 max-w-4xl mx-auto px-8">
        <div className="space-y-10">
          {SECTIONS.map((s, i) => (
            <div
              key={s.id}
              id={s.id}
              className={`reveal delay-${Math.min(i + 1, 6)} scroll-mt-24`}
            >
              <div className="bg-surface/50 border border-line rounded-2xl p-8 hover:border-line-hi transition-colors duration-300">
                <h2 className="text-[1.25rem] font-bold tracking-[-0.02em] mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.title.replace(/^\d+\.\s*/, '')}
                </h2>
                <p className="text-[0.9rem] text-subtle leading-[1.8] mb-4">
                  {s.content}
                </p>
                {s.list && (
                  <ul className="space-y-2.5 ml-1">
                    {s.list.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-[0.87rem] text-subtle leading-[1.7]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-[0.55rem] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {s.footer && (
                  <p className="text-[0.87rem] text-subtle leading-[1.7] mt-4 pt-4 border-t border-line">
                    {s.footer}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Last updated ────────────────────────────────────────────── */}
        <div className="reveal mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-full text-[0.8rem] text-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Ostatnia aktualizacja: 23 kwietnia 2026
          </div>
        </div>

        {/* ── Back to home ─────────────────────────────────────────────── */}
        <div className="reveal mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-subtle text-sm hover:text-white transition-colors duration-200"
          >
            ← Powrót do strony głównej
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-line py-12">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center justify-between flex-wrap gap-3 text-[0.8rem] text-faint">
            <span>© 2026 {APP_NAME}. Wszelkie prawa zastrzeżone.</span>
            <span>by lapkaq</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPolicy
