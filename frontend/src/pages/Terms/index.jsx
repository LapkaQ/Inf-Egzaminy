import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

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
    id: 'definicje',
    title: '1. Definicje',
    content: 'Ilekroć w niniejszym Regulaminie jest mowa o:',
    list: [
      'Serwis — serwis internetowy dostępny pod adresem inf-egzaminy.pl, umożliwiający korzystanie z usług korepetycji online z zakresu kwalifikacji zawodowych INF.03 i INF.04.',
      'Sprzedawca / Usługodawca — Wojciech Gawryluk, ul. Wierzbowa 3a/1, 15-743 Białystok, adres e-mail: kontakt@inf-egzaminy.pl.',
      'Użytkownik — osoba fizyczna, która korzysta z Serwisu (zarówno Uczeń, jak i Korepetytor).',
      'Uczeń — zarejestrowany Użytkownik korzystający z usług korepetycji.',
      'Korepetytor — zarejestrowany Użytkownik świadczący usługi korepetycji za pośrednictwem Serwisu.',
      'Konto — indywidualne konto Użytkownika w Serwisie, chronione loginem (adresem e-mail) i hasłem.',
      'Lekcja — pojedyncza sesja korepetycji zarezerwowana za pośrednictwem Serwisu.',
      'Regulamin — niniejszy dokument określający zasady korzystania z Serwisu.',
    ],
  },
  {
    id: 'postanowienia',
    title: '2. Postanowienia ogólne',
    content: null,
    list: [
      'Właścicielem i operatorem Serwisu jest Wojciech Gawryluk, ul. Wierzbowa 3a/1, 15-743 Białystok.',
      'Serwis umożliwia wyszukiwanie korepetytorów, rezerwację lekcji online, zarządzanie kalendarzem zajęć oraz wystawianie opinii.',
      'Korzystanie z Serwisu wymaga akceptacji niniejszego Regulaminu oraz Polityki Prywatności.',
      'Serwis jest dostępny pod adresem: inf-egzaminy.pl.',
      'Kontakt z obsługą klienta: e-mail kontakt@inf-egzaminy.pl.',
    ],
  },
  {
    id: 'rejestracja',
    title: '3. Rejestracja i konto użytkownika',
    content: null,
    list: [
      'Rejestracja w Serwisie jest dobrowolna i bezpłatna.',
      'Użytkownik podczas rejestracji podaje: imię i nazwisko, adres e-mail oraz hasło.',
      'Użytkownik zobowiązany jest do podania prawdziwych i aktualnych danych.',
      'Po rejestracji Użytkownik otrzymuje wiadomość e-mail z linkiem weryfikacyjnym. Konto zostaje aktywowane po kliknięciu w link.',
      'Użytkownik ponosi pełną odpowiedzialność za bezpieczeństwo swojego hasła i danych logowania.',
      'Jedno konto może być przypisane wyłącznie do jednej osoby fizycznej.',
      'Usługodawca zastrzega sobie prawo do zawieszenia lub usunięcia konta Użytkownika, który narusza postanowienia Regulaminu.',
    ],
  },
  {
    id: 'uslugi',
    title: '4. Zakres usług',
    content: 'Serwis świadczy następujące usługi drogą elektroniczną:',
    list: [
      'Przeglądanie profili korepetytorów (dostępne bez rejestracji).',
      'Rezerwacja lekcji korepetycji z wybranym korepetytorem (wymaga rejestracji jako Uczeń).',
      'Udostępnianie kalendarza dostępności i zarządzanie harmonogramem lekcji (dla Korepetytorów).',
      'System ocen i opinii — po odbyciu lekcji Uczeń może wystawić ocenę Korepetytorowi.',
      'Panel użytkownika (Dashboard) — przegląd zarezerwowanych lekcji, historia, zarządzanie kontem.',
    ],
  },
  {
    id: 'rezerwacja',
    title: '5. Rezerwacja i realizacja lekcji',
    content: null,
    list: [
      'Uczeń rezerwuje lekcję wybierając dostępny termin z kalendarza Korepetytora.',
      'Po dokonaniu rezerwacji Uczeń i Korepetytor otrzymują potwierdzenie e-mailem.',
      'Lekcja odbywa się w formie zdalnej za pośrednictwem platformy wideokonferencyjnej (np. Zoom).',
      'W przypadku nieodbycia się lekcji z winy Korepetytora, Uczeń ma prawo do bezpłatnego przełożenia terminu.',
      'Odwołanie lekcji jest możliwe najpóźniej 24 godziny przed zaplanowanym terminem.',
    ],
  },
  {
    id: 'platnosci',
    title: '6. Płatności',
    content: null,
    list: [
      'Korzystanie z Serwisu (rejestracja, przeglądanie profili) jest bezpłatne.',
      'Płatność za lekcje korepetycji dokonywana jest za pośrednictwem zintegrowanego systemu płatności online.',
      'Ceny lekcji są ustalane indywidualnie przez Korepetytorów i podawane w złotych polskich (PLN) brutto.',
      'Serwis może pobierać prowizję od transakcji, o czym Korepetytor jest informowany przy rejestracji.',
      'Usługodawca nie przechowuje danych kart płatniczych Użytkowników — płatności obsługiwane są przez zewnętrznego operatora płatności.',
    ],
  },
  {
    id: 'reklamacje',
    title: '7. Reklamacje',
    content: null,
    list: [
      'Użytkownik ma prawo zgłosić reklamację dotyczącą działania Serwisu lub zrealizowanej usługi.',
      'Reklamacje należy składać na adres e-mail: kontakt@inf-egzaminy.pl.',
      'Reklamacja powinna zawierać: dane Użytkownika (imię, nazwisko, adres e-mail), opis problemu oraz oczekiwany sposób rozwiązania.',
      'Usługodawca rozpatruje reklamację w terminie 14 dni roboczych od dnia jej otrzymania.',
      'Odpowiedź na reklamację zostanie przesłana na adres e-mail podany w zgłoszeniu.',
    ],
  },
  {
    id: 'odstapienie',
    title: '8. Prawo do odstąpienia od umowy',
    content: null,
    list: [
      'Użytkownik będący konsumentem ma prawo do odstąpienia od umowy zawartej na odległość w terminie 14 dni od jej zawarcia, bez podawania przyczyny.',
      'Prawo do odstąpienia od umowy nie przysługuje w przypadku usługi, która została w pełni wykonana za wyraźną zgodą konsumenta przed upływem terminu do odstąpienia.',
      'Oświadczenie o odstąpieniu od umowy można złożyć e-mailem na adres: kontakt@inf-egzaminy.pl.',
      'W przypadku skutecznego odstąpienia, zwrot środków następuje w terminie 14 dni na rachunek, z którego dokonano płatności.',
    ],
  },
  {
    id: 'odpowiedzialnosc',
    title: '9. Odpowiedzialność',
    content: null,
    list: [
      'Usługodawca dokłada wszelkich starań, aby Serwis działał poprawnie i bez przerw.',
      'Usługodawca nie ponosi odpowiedzialności za treści zamieszczone przez Korepetytorów w ich profilach.',
      'Usługodawca nie ponosi odpowiedzialności za jakość lekcji — pełną odpowiedzialność za realizację usługi ponosi Korepetytor.',
      'Usługodawca nie ponosi odpowiedzialności za przerwy w dostępie do Serwisu wynikające z przyczyn technicznych, aktualizacji lub siły wyższej.',
      'Użytkownicy zobowiązani są do korzystania z Serwisu zgodnie z obowiązującym prawem i zasadami współżycia społecznego.',
    ],
  },
  {
    id: 'dane-osobowe',
    title: '10. Ochrona danych osobowych',
    content: null,
    list: [
      'Administratorem danych osobowych Użytkowników jest Wojciech Gawryluk, ul. Wierzbowa 3a/1, 15-743 Białystok.',
      'Dane osobowe przetwarzane są zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).',
      'Szczegółowe informacje dotyczące przetwarzania danych osobowych znajdują się w Polityce Prywatności dostępnej pod adresem: inf-egzaminy.pl/privacy-policy.',
    ],
  },
  {
    id: 'postanowienia-koncowe',
    title: '11. Postanowienia końcowe',
    content: null,
    list: [
      'Regulamin wchodzi w życie z dniem 23 kwietnia 2026 r.',
      'Usługodawca zastrzega sobie prawo do zmiany Regulaminu. O zmianach Użytkownicy zostaną poinformowani za pośrednictwem wiadomości e-mail lub komunikatu w Serwisie.',
      'W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz Ustawy o prawach konsumenta.',
      'Wszelkie spory wynikające z korzystania z Serwisu będą rozstrzygane przez sąd właściwy dla siedziby Usługodawcy.',
      'Aktualna wersja Regulaminu jest zawsze dostępna na stronie: inf-egzaminy.pl/terms.',
    ],
  },
]

export const Terms = () => {
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
              Regulamin{' '}
              <span className={GRAD_TEXT}>Serwisu</span>
            </h1>
            <p className="text-subtle text-[1.05rem] max-w-[560px] mx-auto leading-[1.7]">
              Zasady korzystania z platformy inf-egzaminy.pl — korepetycje
              online z kwalifikacji INF.03 i INF.04.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-line-hi to-transparent" />

      {/* ── SELLER INFO BOX ──────────────────────────────────────────────── */}
      <section className="py-12 max-w-4xl mx-auto px-8">
        <div className="reveal">
          <div className="p-px bg-gradient-to-br from-accent/50 to-accent-2/50 rounded-2xl">
            <div className="bg-surface rounded-[14px] p-7">
              <div className="text-[0.78rem] font-bold text-white uppercase tracking-[0.06em] mb-4">
                Dane sprzedawcy
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[0.9rem]">
                <div>
                  <div className="text-faint text-[0.78rem] mb-1">Imię i nazwisko</div>
                  <div className="text-white font-medium">Wojciech Gawryluk</div>
                </div>
                <div>
                  <div className="text-faint text-[0.78rem] mb-1">Adres</div>
                  <div className="text-white font-medium">ul. Wierzbowa 3a/1, 15-743 Białystok</div>
                </div>
                <div>
                  <div className="text-faint text-[0.78rem] mb-1">E-mail</div>
                  <div className="text-white font-medium">kontakt@inf-egzaminy.pl</div>
                </div>
                <div>
                  <div className="text-faint text-[0.78rem] mb-1">Serwis</div>
                  <div className="text-white font-medium">inf-egzaminy.pl</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABLE OF CONTENTS ────────────────────────────────────────────── */}
      <section className="pb-12 max-w-4xl mx-auto px-8">
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
                {s.content && (
                  <p className="text-[0.9rem] text-subtle leading-[1.8] mb-4">
                    {s.content}
                  </p>
                )}
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
            <span>© 2026 inf-egzaminy.pl — Wojciech Gawryluk. Wszelkie prawa zastrzeżone.</span>
            <span>by lapkaq</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Terms
