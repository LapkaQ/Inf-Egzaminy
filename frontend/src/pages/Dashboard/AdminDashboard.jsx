import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminOverview,
  getAdminBookings,
  patchAdminBooking,
  patchAdminSession,
  getAdminUsers,
  patchAdminUser,
  patchAdminTutorProfile,
  promoteTutor,
  demoteTutor,
  sendEmailToUser,
  sendEmailToSelected,
  sendEmailToAll,
} from '../../services/admin';
import { cancelBooking, getTutorById } from '../../services/tutors';

const GRAD = 'bg-gradient-to-br from-accent to-accent-2';
const INPUT =
  'w-full bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-faint outline-none focus:border-accent/50 transition-all duration-200 font-sans';
const BTN_SECONDARY =
  'px-3 py-1.5 rounded-lg border border-line-hi text-subtle text-xs font-medium hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer bg-transparent font-sans';
const BTN_DANGER =
  'px-3 py-1.5 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all cursor-pointer bg-transparent border-0 font-sans';

const bookingStatusLabel = (s) =>
  ({ pending: 'Oczekuje', confirmed: 'Potwierdzone', cancelled: 'Anulowane' }[s] || s);
const sessionStatusLabel = (s) =>
  ({ scheduled: 'Zaplanowana', completed: 'Zakończona' }[s] || s);

const formatDt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toLocalInput = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(null);

  const [editBooking, setEditBooking] = useState(null);
  const [editSession, setEditSession] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editTutor, setEditTutor] = useState(null);

  // ─── Email state ─────────────────────────────────────────────────────────
  const [emailMode, setEmailMode] = useState('single'); // single | selected | all
  const [emailUserId, setEmailUserId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailRoleFilter, setEmailRoleFilter] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [emailUserSearch, setEmailUserSearch] = useState('');

  const loadOverview = useCallback(() => {
    getAdminOverview().then(setOverview).catch(() => {});
  }, []);

  const loadBookings = useCallback(() => {
    getAdminBookings(bookingFilter || undefined)
      .then(setBookings)
      .catch(() => setErr('Nie udało się wczytać rezerwacji.'));
  }, [bookingFilter]);

  const loadUsers = useCallback(() => {
    getAdminUsers(userRoleFilter || undefined)
      .then(setUsers)
      .catch(() => setErr('Nie udało się wczytać użytkowników.'));
  }, [userRoleFilter]);

  useEffect(() => {
    setLoading(true);
    setErr('');
    Promise.all([getAdminOverview().then(setOverview), loadBookings(), loadUsers()])
      .catch(() => setErr('Błąd ładowania panelu.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'bookings') loadBookings();
  }, [tab, bookingFilter, loadBookings]);

  useEffect(() => {
    if (tab === 'users' || tab === 'email') loadUsers();
  }, [tab, userRoleFilter, loadUsers]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleCancelBooking = async (id) => {
    setBusy(`cancel-${id}`);
    try {
      const updated = await cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated, student_name: b.student_name, tutor_name: b.tutor_name } : b)));
      loadOverview();
    } catch (e) {
      setErr(e.message || 'Anulowanie nie powiodło się.');
    } finally {
      setBusy(null);
    }
  };

  const saveBooking = async (e) => {
    e.preventDefault();
    if (!editBooking) return;
    setBusy('save-booking');
    setErr('');
    try {
      const body = {};
      if (editBooking._start) body.start_time = new Date(editBooking._start).toISOString();
      if (editBooking._end) body.end_time = new Date(editBooking._end).toISOString();
      if (editBooking._status) body.status = editBooking._status;
      const updated = await patchAdminBooking(editBooking.id, body);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditBooking(null);
      loadOverview();
    } catch (e) {
      setErr(e.message || 'Zapis nie powiódł się.');
    } finally {
      setBusy(null);
    }
  };

  const saveSession = async (e) => {
    e.preventDefault();
    if (!editSession) return;
    setBusy('save-session');
    setErr('');
    try {
      const body = {};
      if (editSession._url) body.meeting_url = editSession._url;
      if (editSession._status) body.status = editSession._status;
      await patchAdminSession(editSession.id, body);
      await loadBookings();
      setEditSession(null);
    } catch (e) {
      setErr(e.message || 'Zapis sesji nie powiódł się.');
    } finally {
      setBusy(null);
    }
  };

  const saveUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setBusy('save-user');
    setErr('');
    try {
      const body = {};
      if (editUser._name !== undefined) body.name = editUser._name;
      if (editUser._email !== undefined) body.email = editUser._email;
      await patchAdminUser(editUser.id, body);
      await loadUsers();
      setEditUser(null);
    } catch (e) {
      setErr(e.message || 'Zapis użytkownika nie powiódł się.');
    } finally {
      setBusy(null);
    }
  };

  const saveTutor = async (e) => {
    e.preventDefault();
    if (!editTutor) return;
    setBusy('save-tutor');
    setErr('');
    try {
      const rawSubjects = editTutor._subjects
        ? editTutor._subjects.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const body = {};
      if (editTutor._bio !== undefined) body.bio = editTutor._bio;
      const priceNum = editTutor._price !== '' && editTutor._price !== undefined ? Number(editTutor._price) : NaN;
      if (!Number.isNaN(priceNum) && priceNum > 0) body.price_per_hour = priceNum;
      if (rawSubjects.length) body.subjects = rawSubjects;
      if (Object.keys(body).length === 0) {
        setErr('Wypełnij przynajmniej jedno pole (bio, cena lub przedmioty INF03 / INF04).');
        setBusy(null);
        return;
      }
      await patchAdminTutorProfile(editTutor.userId, body);
      await loadUsers();
      setEditTutor(null);
    } catch (e) {
      setErr(e.message || 'Zapis profilu nie powiódł się.');
    } finally {
      setBusy(null);
    }
  };

  const handlePromote = async (userId) => {
    setBusy(`promote-${userId}`);
    setErr('');
    try {
      await promoteTutor(userId);
      await loadUsers();
      loadOverview();
    } catch (e) {
      setErr(e.message || 'Nadanie roli nie powiodło się.');
    } finally {
      setBusy(null);
    }
  };

  const handleDemote = async (userId) => {
    setBusy(`demote-${userId}`);
    setErr('');
    try {
      await demoteTutor(userId);
      await loadUsers();
      loadOverview();
    } catch (e) {
      setErr(e.message || 'Zmiana roli nie powiodła się.');
    } finally {
      setBusy(null);
    }
  };

  // ─── Email sending ─────────────────────────────────────────────────────────
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setErr('Podaj temat i treść wiadomości.');
      return;
    }
    setBusy('send-email');
    setErr('');
    try {
      let result;
      if (emailMode === 'single') {
        const uid = parseInt(emailUserId);
        if (!uid) {
          setErr('Podaj prawidłowe ID użytkownika.');
          setBusy(null);
          return;
        }
        result = await sendEmailToUser(uid, emailSubject, emailMessage);
      } else if (emailMode === 'selected') {
        if (selectedUserIds.length === 0) {
          setErr('Wybierz przynajmniej jednego użytkownika.');
          setBusy(null);
          return;
        }
        result = await sendEmailToSelected(selectedUserIds, emailSubject, emailMessage);
      } else {
        result = await sendEmailToAll(emailSubject, emailMessage, emailRoleFilter || undefined);
      }
      setSuccessMsg(result.message);
      setEmailSubject('');
      setEmailMessage('');
      setEmailUserId('');
      setSelectedUserIds([]);
    } catch (e) {
      setErr(e.message || 'Wysyłanie emaila nie powiodło się.');
    } finally {
      setBusy(null);
    }
  };

  const toggleUserSelection = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filtered = getFilteredUsersForEmail();
    const allIds = filtered.map((u) => u.id);
    setSelectedUserIds(allIds);
  };

  const deselectAll = () => setSelectedUserIds([]);

  const getFilteredUsersForEmail = () => {
    return users.filter((u) => {
      const matchSearch = !emailUserSearch ||
        u.name.toLowerCase().includes(emailUserSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(emailUserSearch.toLowerCase());
      return matchSearch;
    });
  };

  const tabBtn = (id, label, icon = '') => (
    <button
      type="button"
      key={id}
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer font-sans border ${
        tab === id
          ? `${GRAD} text-white border-transparent`
          : 'bg-surface border-line text-subtle hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      <div className="max-w-6xl mx-auto px-8 py-10 pb-24">
        <div className="mb-8 animate-fade-up">
          <p className="text-subtle text-xs font-semibold uppercase tracking-wider mb-1">Panel administratora</p>
          <h1 className="text-[clamp(1.5rem,3.5vw,2rem)] font-black tracking-[-0.04em]">
            Witaj, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-subtle text-sm mt-2 max-w-2xl">
            Zarządzaj rezerwacjami, linkami do spotkań, użytkownikami i profilami korepetytorów. Operacje są zapisywane od razu w systemie.
          </p>
        </div>

        {err && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
            {err}
            <button type="button" className="ml-3 underline cursor-pointer bg-transparent border-0 text-red-200 font-sans" onClick={() => setErr('')}>
              Zamknij
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/25 text-green-300 text-sm animate-fade-up">
            {successMsg}
            <button type="button" className="ml-3 underline cursor-pointer bg-transparent border-0 text-green-200 font-sans" onClick={() => setSuccessMsg('')}>
              Zamknij
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          {tabBtn('overview', 'Przegląd')}
          {tabBtn('bookings', 'Rezerwacje i linki')}
          {tabBtn('users', 'Użytkownicy')}
          {tabBtn('email', 'Maile')}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'overview' && overview && (
              <div className="animate-fade-up">
                <div className="bg-surface-2 border border-line rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm">Skróty</div>
                    <p className="text-subtle text-xs mt-1">Publiczna lista korepetytorów i strona główna.</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/tutors" className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${GRAD}`}>
                      Lista korepetytorów
                    </Link>
                    <Link to="/" className={BTN_SECONDARY}>
                      Strona główna
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {tab === 'bookings' && (
              <div className="space-y-4 animate-fade-up">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-subtle text-xs">Filtr statusu rezerwacji</label>
                  <select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className={`${INPUT} w-auto max-w-xs py-2`}
                  >
                    <option value="">Wszystkie</option>
                    <option value="pending">Oczekuje</option>
                    <option value="confirmed">Potwierdzone</option>
                    <option value="cancelled">Anulowane</option>
                  </select>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-subtle text-xs uppercase tracking-wide">
                        <th className="p-3 font-semibold">ID</th>
                        <th className="p-3 font-semibold">Uczestnicy</th>
                        <th className="p-3 font-semibold">Termin</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Link / sesja</th>
                        <th className="p-3 font-semibold text-right">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-line/80 hover:bg-surface-2/60">
                          <td className="p-3 font-mono text-xs text-subtle">#{b.id}</td>
                          <td className="p-3">
                            <div className="font-medium">{b.student_name}</div>
                            <div className="text-subtle text-xs">→ {b.tutor_name}</div>
                          </td>
                          <td className="p-3 text-xs">
                            <div>{formatDt(b.start_time)}</div>
                            <div className="text-subtle">do {formatDt(b.end_time)}</div>
                          </td>
                          <td className="p-3">
                            <span className="text-xs px-2 py-1 rounded-lg bg-surface-2 border border-line">{bookingStatusLabel(b.status)}</span>
                          </td>
                          <td className="p-3 max-w-[220px]">
                            {b.session ? (
                              <>
                                <button
                                  type="button"
                                  className="text-accent text-xs break-all text-left hover:underline cursor-pointer bg-transparent border-0 font-sans p-0"
                                  onClick={() => copyLink(b.session.meeting_url)}
                                >
                                  {b.session.meeting_url}
                                </button>
                                <div className="text-subtle text-[0.65rem] mt-1">Sesja: {sessionStatusLabel(b.session.status)}</div>
                              </>
                            ) : (
                              <span className="text-subtle text-xs">Brak (anulowano)</span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {b.status !== 'cancelled' && (
                              <button type="button" className={BTN_DANGER} disabled={busy === `cancel-${b.id}`} onClick={() => handleCancelBooking(b.id)}>
                                {busy === `cancel-${b.id}` ? '…' : 'Anuluj'}
                              </button>
                            )}
                            <button
                              type="button"
                              className={`${BTN_SECONDARY} ml-1`}
                              onClick={() =>
                                setEditBooking({
                                  ...b,
                                  _start: toLocalInput(b.start_time),
                                  _end: toLocalInput(b.end_time),
                                  _status: b.status,
                                })
                              }
                            >
                              Termin / status
                            </button>
                            {b.session && (
                              <button
                                type="button"
                                className={`${BTN_SECONDARY} ml-1`}
                                onClick={() =>
                                  setEditSession({
                                    id: b.session.id,
                                    _url: b.session.meeting_url,
                                    _status: b.session.status,
                                    bookingLabel: `${b.student_name} → ${b.tutor_name}`,
                                  })
                                }
                              >
                                Link
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bookings.length === 0 && (
                    <div className="p-8 text-center text-subtle text-sm">Brak rezerwacji przy wybranym filtrze.</div>
                  )}
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="space-y-4 animate-fade-up">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-subtle text-xs">Rola</label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className={`${INPUT} w-auto max-w-xs py-2`}
                  >
                    <option value="">Wszyscy</option>
                    <option value="student">Uczniowie</option>
                    <option value="tutor">Korepetytorzy</option>
                    <option value="admin">Administratorzy</option>
                  </select>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-subtle text-xs uppercase tracking-wide">
                        <th className="p-3 font-semibold">ID</th>
                        <th className="p-3 font-semibold">Imię i nazwisko</th>
                        <th className="p-3 font-semibold">E-mail</th>
                        <th className="p-3 font-semibold">Rola</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-right">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-line/80 hover:bg-surface-2/60">
                          <td className="p-3 font-mono text-xs text-subtle">#{u.id}</td>
                          <td className="p-3 font-medium">{u.name}</td>
                          <td className="p-3 text-xs text-subtle break-all">{u.email}</td>
                          <td className="p-3">
                            <span className="text-xs px-2 py-1 rounded-lg bg-surface-2 border border-line capitalize">{u.role}</span>
                          </td>
                          <td className="p-3">
                            {u.is_verified ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400">Zweryfikowany</span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400">Niezweryfikowany</span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              className={BTN_SECONDARY}
                              onClick={() =>
                                setEditUser({
                                  ...u,
                                  _name: u.name,
                                  _email: u.email,
                                })
                              }
                            >
                              Dane
                            </button>
                            {u.role === 'tutor' && u.tutor_profile_id && (
                              <button
                                type="button"
                                className={`${BTN_SECONDARY} ml-1`}
                                disabled={busy === `load-tutor-${u.id}`}
                                onClick={async () => {
                                  setBusy(`load-tutor-${u.id}`);
                                  setErr('');
                                  try {
                                    const p = await getTutorById(u.id);
                                    setEditTutor({
                                      userId: u.id,
                                      profileId: p.id,
                                      _bio: p.bio ?? '',
                                      _price: String(p.price_per_hour ?? ''),
                                      _subjects: (p.subjects || []).map((s) => s.name).join(', '),
                                    });
                                  } catch (e) {
                                    setErr(e.message || 'Nie udało się wczytać profilu.');
                                  } finally {
                                    setBusy(null);
                                  }
                                }}
                              >
                                {busy === `load-tutor-${u.id}` ? '…' : 'Profil'}
                              </button>
                            )}
                            {u.role === 'student' && (
                              <button
                                type="button"
                                className={`${BTN_SECONDARY} ml-1`}
                                disabled={busy === `promote-${u.id}`}
                                onClick={() => handlePromote(u.id)}
                              >
                                {busy === `promote-${u.id}` ? '…' : '→ Korepetytor'}
                              </button>
                            )}
                            {u.role === 'tutor' && u.id !== user?.id && (
                              <button
                                type="button"
                                className={`${BTN_SECONDARY} ml-1`}
                                disabled={busy === `demote-${u.id}`}
                                onClick={() => handleDemote(u.id)}
                              >
                                {busy === `demote-${u.id}` ? '…' : '→ Uczeń'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Email tab ───────────────────────────────────────────────────── */}
            {tab === 'email' && (
              <div className="animate-fade-up space-y-6">
                {/* Mode selector */}
                <div className="bg-surface border border-line rounded-2xl p-6">
                  <h2 className="font-bold text-lg mb-1">Wyślij wiadomość email</h2>
                  <p className="text-subtle text-xs mb-5">Wybierz odbiorców i napisz wiadomość. Emaile są wysyłane w tle.</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {[
                      ['single', 'Pojedynczy użytkownik'],
                      ['selected', 'Zaznaczeni użytkownicy'],
                      ['all', 'Wszyscy użytkownicy'],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setEmailMode(mode)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer font-sans border ${
                          emailMode === mode
                            ? `${GRAD} text-white border-transparent`
                            : 'bg-surface-2 border-line text-subtle hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendEmail} className="space-y-4">
                    {/* Single user - ID input */}
                    {emailMode === 'single' && (
                      <div>
                        <label className="text-xs text-subtle block mb-1.5">ID użytkownika</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            className={`${INPUT} max-w-[140px]`}
                            placeholder="np. 5"
                            value={emailUserId}
                            onChange={(e) => setEmailUserId(e.target.value)}
                            min={1}
                          />
                          {emailUserId && users.find((u) => u.id === parseInt(emailUserId)) && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-surface-2 border border-line rounded-xl text-xs">
                              <span className="font-medium text-white">
                                {users.find((u) => u.id === parseInt(emailUserId))?.name}
                              </span>
                              <span className="text-subtle">
                                {users.find((u) => u.id === parseInt(emailUserId))?.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selected users - checkbox list */}
                    {emailMode === 'selected' && (
                      <div>
                        <label className="text-xs text-subtle block mb-1.5">
                          Wybrani użytkownicy ({selectedUserIds.length})
                        </label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            className={`${INPUT} max-w-xs`}
                            placeholder="Szukaj po imieniu lub emailu..."
                            value={emailUserSearch}
                            onChange={(e) => setEmailUserSearch(e.target.value)}
                          />
                          <button type="button" className={BTN_SECONDARY} onClick={selectAllFiltered}>
                            Zaznacz wszystkie
                          </button>
                          <button type="button" className={BTN_SECONDARY} onClick={deselectAll}>
                            Odznacz
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto bg-surface-2 border border-line rounded-xl divide-y divide-line">
                          {getFilteredUsersForEmail().map((u) => (
                            <label
                              key={u.id}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                selectedUserIds.includes(u.id) ? 'bg-accent/5' : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                onChange={() => toggleUserSelection(u.id)}
                                className="w-4 h-4 accent-violet-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{u.name}</div>
                                <div className="text-xs text-subtle truncate">{u.email}</div>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-line capitalize shrink-0">
                                {u.role}
                              </span>
                            </label>
                          ))}
                          {getFilteredUsersForEmail().length === 0 && (
                            <div className="p-4 text-center text-subtle text-xs">Brak wyników.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* All users - optional role filter */}
                    {emailMode === 'all' && (
                      <div>
                        <label className="text-xs text-subtle block mb-1.5">Filtruj według roli (opcjonalnie)</label>
                        <select
                          value={emailRoleFilter}
                          onChange={(e) => setEmailRoleFilter(e.target.value)}
                          className={`${INPUT} w-auto max-w-xs py-2`}
                        >
                          <option value="">Wszyscy użytkownicy</option>
                          <option value="student">Tylko uczniowie</option>
                          <option value="tutor">Tylko korepetytorzy</option>
                          <option value="admin">Tylko administratorzy</option>
                        </select>
                        <p className="text-xs text-subtle mt-2">
                          Email zostanie wysłany do <strong className="text-white">
                            {emailRoleFilter
                              ? users.filter((u) => u.role === emailRoleFilter).length
                              : users.length}
                          </strong> użytkowników.
                        </p>
                      </div>
                    )}

                    {/* Subject & Message - common */}
                    <div>
                      <label className="text-xs text-subtle block mb-1.5">Temat wiadomości</label>
                      <input
                        className={INPUT}
                        placeholder="np. Ważna informacja od zespołu KorINF"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        required
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-subtle block mb-1.5">Treść wiadomości</label>
                      <textarea
                        className={`${INPUT} min-h-[140px] resize-y`}
                        placeholder="Wpisz treść wiadomości email..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        required
                        maxLength={5000}
                      />
                      <p className="text-xs text-faint mt-1 text-right">{emailMessage.length} / 5000</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={busy === 'send-email'}
                        className={`px-6 py-3 rounded-xl text-sm font-semibold text-white ${GRAD} hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] transition-all duration-200 cursor-pointer border-0 font-sans disabled:opacity-50 disabled:pointer-events-none`}
                      >
                        {busy === 'send-email' ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Wysyłanie...
                          </span>
                        ) : (
                          `Wyślij ${
                            emailMode === 'single'
                              ? 'do użytkownika'
                              : emailMode === 'selected'
                              ? `do ${selectedUserIds.length} użytkowników`
                              : 'do wszystkich'
                          }`
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Quick send from users list */}
                <div className="bg-surface border border-line rounded-2xl p-6">
                  <h3 className="font-bold text-sm mb-1">Szybka wysyłka</h3>
                  <p className="text-subtle text-xs mb-4">Kliknij na użytkownika, aby szybko wypełnić jego ID.</p>
                  <div className="flex flex-wrap gap-2">
                    {users.slice(0, 20).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setEmailMode('single');
                          setEmailUserId(String(u.id));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer font-sans border ${
                          emailUserId === String(u.id) && emailMode === 'single'
                            ? `${GRAD} text-white border-transparent`
                            : 'bg-surface-2 border-line text-subtle hover:text-white hover:border-white/20'
                        }`}
                      >
                        #{u.id} {u.name}
                      </button>
                    ))}
                    {users.length > 20 && (
                      <span className="px-3 py-1.5 text-xs text-faint">+{users.length - 20} więcej...</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: booking */}
      {editBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">Rezerwacja #{editBooking.id}</h3>
            <form onSubmit={saveBooking} className="space-y-4">
              <div>
                <label className="text-xs text-subtle block mb-1">Początek</label>
                <input type="datetime-local" className={INPUT} value={editBooking._start} onChange={(e) => setEditBooking({ ...editBooking, _start: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">Koniec</label>
                <input type="datetime-local" className={INPUT} value={editBooking._end} onChange={(e) => setEditBooking({ ...editBooking, _end: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">Status rezerwacji</label>
                <select className={INPUT} value={editBooking._status} onChange={(e) => setEditBooking({ ...editBooking, _status: e.target.value })}>
                  <option value="pending">Oczekuje</option>
                  <option value="confirmed">Potwierdzone</option>
                  <option value="cancelled">Anulowane</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className={BTN_SECONDARY} onClick={() => setEditBooking(null)}>
                  Zamknij
                </button>
                <button type="submit" disabled={busy === 'save-booking'} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${GRAD} disabled:opacity-50`}>
                  {busy === 'save-booking' ? 'Zapisywanie…' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="font-bold text-lg mb-1">Sesja spotkania</h3>
            <p className="text-subtle text-xs mb-4">{editSession.bookingLabel}</p>
            <form onSubmit={saveSession} className="space-y-4">
              <div>
                <label className="text-xs text-subtle block mb-1">URL spotkania</label>
                <input
                  type="url"
                  className={INPUT}
                  value={editSession._url}
                  onChange={(e) => setEditSession({ ...editSession, _url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">Status sesji</label>
                <select className={INPUT} value={editSession._status} onChange={(e) => setEditSession({ ...editSession, _status: e.target.value })}>
                  <option value="scheduled">Zaplanowana</option>
                  <option value="completed">Zakończona</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className={BTN_SECONDARY} onClick={() => setEditSession(null)}>
                  Zamknij
                </button>
                <button type="submit" disabled={busy === 'save-session'} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${GRAD} disabled:opacity-50`}>
                  {busy === 'save-session' ? 'Zapisywanie…' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">Użytkownik #{editUser.id}</h3>
            <form onSubmit={saveUser} className="space-y-4">
              <div>
                <label className="text-xs text-subtle block mb-1">Imię i nazwisko</label>
                <input className={INPUT} value={editUser._name} onChange={(e) => setEditUser({ ...editUser, _name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">E-mail</label>
                <input type="email" className={INPUT} value={editUser._email} onChange={(e) => setEditUser({ ...editUser, _email: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className={BTN_SECONDARY} onClick={() => setEditUser(null)}>
                  Zamknij
                </button>
                <button type="submit" disabled={busy === 'save-user'} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${GRAD} disabled:opacity-50`}>
                  {busy === 'save-user' ? 'Zapisywanie…' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTutor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-line rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-1">Profil korepetytora</h3>
            <p className="text-subtle text-xs mb-4">User ID {editTutor.userId} — podaj pola do zmiany (przedmioty: INF03, INF04).</p>
            <form onSubmit={saveTutor} className="space-y-4">
              <div>
                <label className="text-xs text-subtle block mb-1">Bio</label>
                <textarea className={`${INPUT} min-h-[88px]`} value={editTutor._bio} onChange={(e) => setEditTutor({ ...editTutor, _bio: e.target.value })} placeholder="Opis (opcjonalnie)" />
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">Cena za godzinę (PLN)</label>
                <input type="number" min={1} className={INPUT} value={editTutor._price} onChange={(e) => setEditTutor({ ...editTutor, _price: e.target.value })} placeholder="np. 80" />
              </div>
              <div>
                <label className="text-xs text-subtle block mb-1">Przedmioty (oddzielone przecinkami)</label>
                <input className={INPUT} value={editTutor._subjects} onChange={(e) => setEditTutor({ ...editTutor, _subjects: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className={BTN_SECONDARY} onClick={() => setEditTutor(null)}>
                  Zamknij
                </button>
                <button type="submit" disabled={busy === 'save-tutor'} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${GRAD} disabled:opacity-50`}>
                  {busy === 'save-tutor' ? 'Zapisywanie…' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
