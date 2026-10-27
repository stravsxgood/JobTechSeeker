import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ConnectedAccount {
    id: string;
    provider: string;
    email_address: string;
    connection_status:
        | 'connected'
        | 'disconnected'
        | 'reauthorization_required';
    last_sync_at: string | null;
    last_sync_status: string | null;
    created_at: string;
}

export default function IntegrationsPage() {
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [_isLoading, setIsLoading] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [simulatingPreset, setSimulatingPreset] = useState<string | null>(
        null,
    );

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch('/api/v1/email/accounts', {
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                const json = await res.json();
                setAccounts(json.data || []);
            }
        } catch {
            // Silently ignore
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchAccounts();
    }, []);

    // Connect Gmail via OAuth
    const handleConnectGmail = async () => {
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch('/api/v1/email/oauth/google/url', {
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                const json = await res.json();
                if (json.url) {
                    window.location.href = json.url;
                }
            } else {
                setErrorMessage(
                    'Gagal membuat tautan Google OAuth. Pastikan konfigurasi Google Client ID tersedia.',
                );
            }
        } catch {
            setErrorMessage(
                'Terjadi kesalahan jaringan saat menghubungkan ke Google.',
            );
        }
    };

    // Manual Sync Account
    const handleSync = async (accountId: string) => {
        setSyncingId(accountId);
        setActionMessage(null);
        setErrorMessage(null);

        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(
                `/api/v1/email/accounts/${accountId}/sync`,
                {
                    method: 'POST',
                    headers,
                    credentials: 'same-origin',
                },
            );

            const data = await res.json();

            if (res.ok) {
                const count = data.results?.events_created || 0;
                setActionMessage(
                    `Sinkronisasi selesai: ${count} pesan rekrutmen baru terdeteksi.`,
                );
                void fetchAccounts();
            } else {
                setErrorMessage(data.message || 'Gagal menyinkronkan email.');
            }
        } catch {
            setErrorMessage(
                'Terjadi gangguan jaringan saat sinkronisasi email.',
            );
        } finally {
            setSyncingId(null);
        }
    };

    // Disconnect Account
    const handleDisconnect = async (accountId: string) => {
        if (
            !confirm(
                'Apakah Anda yakin ingin memutuskan sambungan akun Gmail ini? Sinkronisasi email akan dihentikan dan token enkripsi akan dihapus.',
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(
                `/api/v1/email/accounts/${accountId}/disconnect`,
                {
                    method: 'POST',
                    headers,
                    credentials: 'same-origin',
                },
            );

            if (res.ok) {
                setActionMessage('Koneksi akun Gmail berhasil diputuskan.');
                void fetchAccounts();
            }
        } catch {
            setErrorMessage('Gagal memutuskan akun email.');
        }
    };

    // Simulate Recruitment Email Event
    const handleSimulateEmail = async (preset: string) => {
        setSimulatingPreset(preset);
        setActionMessage(null);
        setErrorMessage(null);

        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch('/api/v1/email/events/simulate', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({ preset }),
            });

            const data = await res.json();

            if (res.ok) {
                setActionMessage(
                    `Simulasi email "${preset}" berhasil dibuat! Silakan buka halaman Pusat Notifikasi untuk meninjau.`,
                );
                void fetchAccounts();
            } else {
                setErrorMessage(
                    data.message || 'Gagal membuat simulasi email.',
                );
            }
        } catch {
            setErrorMessage(
                'Terjadi gangguan jaringan saat membuat simulasi email.',
            );
        } finally {
            setSimulatingPreset(null);
        }
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return 'Belum pernah sinkron';
        return new Date(iso).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout
            title="Integrasi Akun & Email"
            action={
                <Link
                    href="/notifications"
                    className="flex min-h-[44px] items-center gap-2 rounded-[8px] border border-[#313131] bg-[#141414] px-3.5 py-2 text-[13px] font-medium text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                >
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span className="hidden sm:inline">
                        Buka Pusat Notifikasi
                    </span>
                    <span className="sm:hidden">Notifikasi</span>
                </Link>
            }
        >
            <Head title="Integrasi Akun & Email - CareerPilot AI" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    GMAIL INTEGRATION & RECRUITMENT TRIAGE
                                </span>
                                <span className="rounded-[4px] bg-[#6798ff]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#6798ff]">
                                    ENCRYPTED
                                </span>
                            </div>
                            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.4px] text-[#ffffff]">
                                Integrasi Akun Email Rekrutmen
                            </h2>
                            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#a7a7a7]">
                                Sambungkan akun Gmail Anda secara aman untuk
                                mendeteksi email undangan wawancara, job offer,
                                atau pembaruan status seleksi secara
                                semiotomatis tanpa pernah melewatkan pesan
                                penting HR.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notifications & Error messages */}
                {actionMessage && (
                    <div className="flex items-center justify-between rounded-[6px] border border-[#34d399]/40 bg-[#34d399]/10 p-3.5 text-[13px] text-[#34d399]">
                        <span>{actionMessage}</span>
                        <Link
                            href="/notifications"
                            className="ml-4 font-medium underline hover:text-[#ffffff]"
                        >
                            Lihat di Notifikasi →
                        </Link>
                    </div>
                )}

                {errorMessage && (
                    <div className="rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-3.5 text-[13px] text-[#f87171]">
                        {errorMessage}
                    </div>
                )}

                {/* Connected Accounts Section */}
                <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-[#313131] pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                                Akun Email Terhubung
                            </h3>
                            <p className="text-[12px] text-[#7c7c7c]">
                                Kelola otorisasi Google OAuth dan status
                                sinkronisasi pesan masuk.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleConnectGmail}
                            className="min-h-[44px] w-full justify-center sm:min-h-[40px] sm:w-auto"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                            </svg>
                            <span>Hubungkan Google Gmail</span>
                        </Button>
                    </div>

                    {accounts.length > 0 ? (
                        <div className="space-y-3">
                            {accounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="flex flex-col gap-4 rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[#313131] bg-[#0a0a0a] text-[#ffffff]">
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-[14px] font-semibold text-[#ffffff]">
                                                    {acc.email_address}
                                                </h4>
                                                <Badge
                                                    variant={
                                                        acc.connection_status ===
                                                        'connected'
                                                            ? 'success'
                                                            : acc.connection_status ===
                                                                'disconnected'
                                                              ? 'default'
                                                              : 'warning'
                                                    }
                                                    size="sm"
                                                >
                                                    {acc.connection_status ===
                                                    'connected'
                                                        ? 'Terhubung'
                                                        : acc.connection_status ===
                                                            'disconnected'
                                                          ? 'Terputus'
                                                          : 'Perlu Otorisasi Ulang'}
                                                </Badge>
                                            </div>
                                            <p className="mt-0.5 text-[12px] text-[#7c7c7c]">
                                                Sinkronisasi Terakhir:{' '}
                                                {formatDate(acc.last_sync_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                                        {acc.connection_status ===
                                            'connected' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    handleSync(acc.id)
                                                }
                                                isLoading={syncingId === acc.id}
                                                className="min-h-[40px] flex-1 justify-center sm:min-h-[36px] sm:flex-none"
                                            >
                                                <svg
                                                    width="13"
                                                    height="13"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M23 4v6h-6"></path>
                                                    <path d="M1 20v-6h6"></path>
                                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                                </svg>
                                                <span>Sinkronkan Sekarang</span>
                                            </Button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDisconnect(acc.id)
                                            }
                                            className="min-h-[40px] rounded-[6px] border border-transparent px-3 py-1.5 text-[12px] text-[#f87171] transition-colors hover:bg-[#f87171]/10 sm:min-h-0"
                                        >
                                            Putuskan Sambungan
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 py-8 text-center text-[13px] text-[#7c7c7c]">
                            <p>Belum ada akun Gmail yang terhubung.</p>
                            <p className="mx-auto max-w-md text-[12px] text-[#555555]">
                                Hubungkan akun Gmail untuk membaca pesan
                                rekrutmen secara otomatis, atau gunakan simulasi
                                uji coba di bawah ini.
                            </p>
                        </div>
                    )}
                </div>

                {/* Simulation & Testing Sandbox for Email Triage */}
                <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="border-b border-[#313131] pb-3">
                        <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                            SIMULASI & TESTING WORKFLOW
                        </span>
                        <h3 className="mt-0.5 text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                            Uji Coba Alur Email Triage Masuk
                        </h3>
                        <p className="text-[12px] text-[#a7a7a7]">
                            Buat contoh pesan rekrutmen masuk untuk menguji
                            bagaimana AI Triage mengekstrak detail
                            interview/offer dan menampilkannya di Pusat
                            Notifikasi untuk Anda konfirmasi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {[
                            {
                                id: 'interview_invitation',
                                title: 'Undangan Wawancara',
                                company: 'GoTo / Tokopedia',
                                desc: 'Google Meet link & jadwal sesi teknis',
                                badge: 'accent',
                            },
                            {
                                id: 'offer',
                                title: 'Job Offering Letter',
                                company: 'Bank Mandiri',
                                desc: 'Penawaran kerja resmi & update status offer',
                                badge: 'success',
                            },
                            {
                                id: 'pending',
                                title: 'Pemberitahuan Berkas',
                                company: 'Shopee Indonesia',
                                desc: 'Konfirmasi berkas dalam tahap screening',
                                badge: 'warning',
                            },
                            {
                                id: 'rejection',
                                title: 'Update Penolakan',
                                company: 'Traveloka',
                                desc: 'Pemberitahuan seleksi belum berhasil',
                                badge: 'danger',
                            },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSimulateEmail(item.id)}
                                disabled={simulatingPreset !== null}
                                className="flex flex-col rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5 text-left transition-all hover:border-[#6798ff] disabled:opacity-50"
                            >
                                <div className="mb-1.5 flex items-center justify-between">
                                    <Badge
                                        variant={item.badge as any}
                                        size="sm"
                                    >
                                        {item.title}
                                    </Badge>
                                </div>
                                <span className="text-[13px] font-semibold text-[#ffffff]">
                                    {item.company}
                                </span>
                                <span className="mt-0.5 text-[11px] leading-snug text-[#7c7c7c]">
                                    {item.desc}
                                </span>
                                <div className="mt-3 border-t border-[#313131] pt-2 font-mono text-[11px] text-[#6798ff]">
                                    {simulatingPreset === item.id
                                        ? 'Membuat Simulasi...'
                                        : '+ Tambah Event Simulasi'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Privacy & Security Guarantees (PRD FR-EMAIL-001) */}
                <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div>
                        <span className="font-mono text-[11px] tracking-[0.85px] text-[#34d399] uppercase">
                            SECURITY & PRIVACY BY DESIGN
                        </span>
                        <h3 className="mt-0.5 text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                            Jaminan Privasi & Perlindungan Data Anda
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1 rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth="2"
                                >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <h4 className="text-[13px] font-semibold text-[#ffffff]">
                                    Izin Read-Only Minimal (gmail.readonly)
                                </h4>
                            </div>
                            <p className="pl-6 text-[12px] leading-relaxed text-[#a7a7a7]">
                                CareerPilot hanya memindai metadata dan pengirim
                                pesan email rekrutmen. Kami tidak membaca email
                                pribadi di luar topik pekerjaan.
                            </p>
                        </div>

                        <div className="space-y-1 rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line
                                        x1="4.93"
                                        y1="4.93"
                                        x2="19.07"
                                        y2="19.07"
                                    ></line>
                                </svg>
                                <h4 className="text-[13px] font-semibold text-[#ffffff]">
                                    Tidak Ada Akses Kirim atau Hapus Email
                                </h4>
                            </div>
                            <p className="pl-6 text-[12px] leading-relaxed text-[#a7a7a7]">
                                Aplikasi tidak memiliki izin untuk mengirim
                                email atas nama Anda atau menghapus email apa
                                pun dari kotak masuk Anda.
                            </p>
                        </div>

                        <div className="space-y-1 rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth="2"
                                >
                                    <rect
                                        x="3"
                                        y="11"
                                        width="18"
                                        height="11"
                                        rx="2"
                                        ry="2"
                                    ></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <h4 className="text-[13px] font-semibold text-[#ffffff]">
                                    Enkripsi Token Server-Side
                                </h4>
                            </div>
                            <p className="pl-6 text-[12px] leading-relaxed text-[#a7a7a7]">
                                Token akses Google OAuth dienkripsi penuh
                                menggunakan AES-256-CBC pada level database dan
                                tidak pernah diekspos ke frontend.
                            </p>
                        </div>

                        <div className="space-y-1 rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth="2"
                                >
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                <h4 className="text-[13px] font-semibold text-[#ffffff]">
                                    Kendali Pemutusan Kapan Saja
                                </h4>
                            </div>
                            <p className="pl-6 text-[12px] leading-relaxed text-[#a7a7a7]">
                                Anda dapat memutuskan integrasi kapan pun. Saat
                                diputuskan, token langsung dihapus seketika dan
                                sinkronisasi dihentikan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
