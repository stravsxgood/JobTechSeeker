import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface CareerPreferenceData {
    id?: string;
    target_roles?: string[];
    preferred_locations?: string[];
    salary_expectation_min?: number | string | null;
    salary_expectation_max?: number | string | null;
    salary_currency?: string | null;
    weekly_application_target?: number | null;
}

interface UserData {
    id: string;
    name: string;
    email: string;
    timezone: string;
    locale: string;
    career_preference?: CareerPreferenceData | null;
}

export default function SettingsPage() {
    const { auth } = usePage<{
        auth?: { user?: { name: string; email: string; timezone?: string } };
    }>().props;

    const [activeTab, setActiveTab] = useState<
        'profile' | 'security' | 'danger'
    >('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingSecurity, setIsSavingSecurity] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // Profile form state
    const [name, setName] = useState(auth?.user?.name || '');
    const [email, setEmail] = useState(auth?.user?.email || '');
    const [timezone, setTimezone] = useState(
        auth?.user?.timezone || 'Asia/Jakarta',
    );
    const [locale, setLocale] = useState('id-ID');

    // Career preferences state
    const [targetRoles, setTargetRoles] = useState<string[]>([]);
    const [roleInput, setRoleInput] = useState('');
    const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
    const [locationInput, setLocationInput] = useState('');
    const [salaryMin, setSalaryMin] = useState<string>('');
    const [salaryMax, setSalaryMax] = useState<string>('');
    const [salaryCurrency, setSalaryCurrency] = useState('IDR');
    const [weeklyTarget, setWeeklyTarget] = useState<number>(5);

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete account modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Feedback messages
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
    const [securityError, setSecurityError] = useState<string | null>(null);

    // Fetch user details from /api/v1/me
    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch('/api/v1/me', {
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                const json = await res.json();
                const user: UserData = json.data;
                setName(user.name || '');
                setEmail(user.email || '');
                setTimezone(user.timezone || 'Asia/Jakarta');
                setLocale(user.locale || 'id-ID');

                if (user.career_preference) {
                    const pref = user.career_preference;
                    setTargetRoles(pref.target_roles || []);
                    setPreferredLocations(pref.preferred_locations || []);
                    setSalaryMin(
                        pref.salary_expectation_min
                            ? String(pref.salary_expectation_min)
                            : '',
                    );
                    setSalaryMax(
                        pref.salary_expectation_max
                            ? String(pref.salary_expectation_max)
                            : '',
                    );
                    setSalaryCurrency(pref.salary_currency || 'IDR');
                    setWeeklyTarget(pref.weekly_application_target ?? 5);
                }
            }
        } catch {
            // Silently fallback to props
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchUserData();
    }, []);

    // Helper for CSRF & Auth headers
    const getRequestHeaders = () => {
        const token = localStorage.getItem('careerpilot_token');
        const csrfToken =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    // Role tags handling
    const handleAddRole = (e: React.KeyboardEvent | React.MouseEvent) => {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        const trimmed = roleInput.trim();
        if (trimmed && !targetRoles.includes(trimmed)) {
            setTargetRoles([...targetRoles, trimmed]);
            setRoleInput('');
        }
    };

    const handleRemoveRole = (roleToRemove: string) => {
        setTargetRoles(targetRoles.filter((r) => r !== roleToRemove));
    };

    // Location tags handling
    const handleAddLocation = (e: React.KeyboardEvent | React.MouseEvent) => {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        const trimmed = locationInput.trim();
        if (trimmed && !preferredLocations.includes(trimmed)) {
            setPreferredLocations([...preferredLocations, trimmed]);
            setLocationInput('');
        }
    };

    const handleRemoveLocation = (locToRemove: string) => {
        setPreferredLocations(
            preferredLocations.filter((l) => l !== locToRemove),
        );
    };

    // Save Profile & Career Preferences
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileSuccess(null);
        setProfileError(null);

        try {
            const body: Record<string, unknown> = {
                name,
                timezone,
                locale,
                target_roles: targetRoles,
                preferred_locations: preferredLocations,
                salary_currency: salaryCurrency,
                weekly_application_target: Number(weeklyTarget) || 5,
            };

            if (salaryMin !== '')
                body.salary_expectation_min = Number(salaryMin);
            if (salaryMax !== '')
                body.salary_expectation_max = Number(salaryMax);

            const res = await fetch('/api/v1/me', {
                method: 'PATCH',
                headers: getRequestHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                setProfileSuccess(
                    'Profil dan preferensi karier berhasil diperbarui.',
                );
                setTimeout(() => setProfileSuccess(null), 4000);
            } else {
                const message = data.errors
                    ? Object.values(data.errors).flat().join(', ')
                    : data.message || 'Gagal menyimpan profil.';
                setProfileError(message);
            }
        } catch {
            setProfileError('Terjadi kesalahan koneksi saat menyimpan profil.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Save Password Update
    const handleSaveSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSecurity(true);
        setSecuritySuccess(null);
        setSecurityError(null);

        if (newPassword.length < 8) {
            setSecurityError('Kata sandi baru minimal harus 8 karakter.');
            setIsSavingSecurity(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setSecurityError('Konfirmasi kata sandi baru tidak sesuai.');
            setIsSavingSecurity(false);
            return;
        }

        try {
            const res = await fetch('/api/v1/me', {
                method: 'PATCH',
                headers: getRequestHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSecuritySuccess('Kata sandi berhasil diperbarui.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setSecuritySuccess(null), 4000);
            } else {
                const message = data.errors
                    ? Object.values(data.errors).flat().join(', ')
                    : data.message || 'Gagal memperbarui kata sandi.';
                setSecurityError(message);
            }
        } catch {
            setSecurityError(
                'Terjadi kesalahan koneksi saat memperbarui kata sandi.',
            );
        } finally {
            setIsSavingSecurity(false);
        }
    };

    // Delete Account Confirmation
    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDeletingAccount(true);
        setDeleteError(null);

        try {
            const res = await fetch('/api/v1/me', {
                method: 'DELETE',
                headers: getRequestHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({
                    password: deletePassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.removeItem('careerpilot_token');
                setShowDeleteModal(false);
                // Redirect user to home / login
                window.location.href = '/login';
            } else {
                const message = data.errors
                    ? Object.values(data.errors).flat().join(', ')
                    : data.message || 'Gagal menghapus akun.';
                setDeleteError(message);
            }
        } catch {
            setDeleteError('Terjadi kesalahan koneksi saat menghapus akun.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const commonTimezones = [
        { value: 'Asia/Jakarta', label: 'WIB (Asia/Jakarta) — UTC+07:00' },
        { value: 'Asia/Makassar', label: 'WITA (Asia/Makassar) — UTC+08:00' },
        { value: 'Asia/Jayapura', label: 'WIT (Asia/Jayapura) — UTC+09:00' },
        { value: 'Asia/Singapore', label: 'SGT (Asia/Singapore) — UTC+08:00' },
        { value: 'Asia/Tokyo', label: 'JST (Asia/Tokyo) — UTC+09:00' },
        { value: 'UTC', label: 'UTC (Coordinated Universal Time) — UTC+00:00' },
        {
            value: 'Europe/London',
            label: 'GMT/BST (Europe/London) — UTC+00:00',
        },
        {
            value: 'America/New_York',
            label: 'EST/EDT (America/New_York) — UTC-05:00',
        },
        {
            value: 'America/Los_Angeles',
            label: 'PST/PDT (America/Los_Angeles) — UTC-08:00',
        },
    ];

    return (
        <AppLayout
            title="Pengaturan"
            action={
                <div className="flex items-center gap-2">
                    <Badge variant="default" className="font-mono text-[11px]">
                        FR-AUTH-002 / FR-AUTH-003
                    </Badge>
                </div>
            }
        >
            <Head title="Pengaturan Akun & Preferensi Karier - CareerPilot AI" />

            <div className="mx-auto max-w-[1080px] space-y-6">
                {/* Header Context */}
                <div className="flex flex-col gap-1 border-b border-[#313131] pb-5">
                    <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-[#ffffff]">
                        Pengaturan & Profil Akun
                    </h1>
                    <p className="text-[14px] text-[#a7a7a7]">
                        Kelola identitas, preferensi target lamaran kerja, zona
                        waktu jadwal, keamanan kata sandi, dan privasi akun
                        Anda.
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex scrollbar-none items-center gap-2 overflow-x-auto border-b border-[#313131] pb-2 sm:flex-wrap">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'profile'
                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#6798ff]'
                                : 'border border-transparent text-[#a7a7a7] hover:bg-[#141414] hover:text-[#ffffff]'
                        }`}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Profil & Preferensi Karier
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'security'
                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#6798ff]'
                                : 'border border-transparent text-[#a7a7a7] hover:bg-[#141414] hover:text-[#ffffff]'
                        }`}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Keamanan & Kata Sandi
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('danger')}
                        className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'danger'
                                ? 'border border-[#7f1d1d] bg-[#7f1d1d]/20 text-[#f87171]'
                                : 'border border-transparent text-[#a7a7a7] hover:bg-[#7f1d1d]/10 hover:text-[#f87171]'
                        }`}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Zona Bahaya
                    </button>
                </div>

                {/* TAB 1: Profil & Preferensi Karier */}
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        {profileSuccess && (
                            <div className="flex items-center gap-2.5 rounded-[8px] border border-[#34d399]/40 bg-[#34d399]/10 p-4 text-[13px] text-[#34d399]">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>{profileSuccess}</span>
                            </div>
                        )}

                        {profileError && (
                            <div className="flex items-center gap-2.5 rounded-[8px] border border-[#f87171]/40 bg-[#f87171]/10 p-4 text-[13px] text-[#f87171]">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{profileError}</span>
                            </div>
                        )}

                        <form
                            onSubmit={handleSaveProfile}
                            className="space-y-6"
                        >
                            {/* Card: Identitas Akun */}
                            <Card variant="carbon">
                                <CardHeader>
                                    <CardTitle>Identitas Dasar</CardTitle>
                                    <CardDescription>
                                        Informasi kontak dan nama yang
                                        ditampilkan pada dasbor CareerPilot.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Input
                                            id="name-input"
                                            label="Nama Lengkap"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            required
                                            placeholder="Nama Anda"
                                        />

                                        <div className="space-y-1.5">
                                            <label className="block text-[13px] font-medium text-[#a7a7a7]">
                                                Alamat Email
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                disabled
                                                className="min-h-[44px] w-full cursor-not-allowed rounded-[8px] border border-[#313131] bg-[#141414] px-3.5 py-2.5 font-mono text-[14px] text-[#7c7c7c]"
                                            />
                                            <p className="text-[11px] text-[#7c7c7c]">
                                                Email digunakan sebagai
                                                kredensial login utama dan tidak
                                                dapat diubah langsung.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="timezone-select"
                                                className="block text-[13px] font-medium text-[#a7a7a7]"
                                            >
                                                Zona Waktu IANA
                                            </label>
                                            <select
                                                id="timezone-select"
                                                value={timezone}
                                                onChange={(e) =>
                                                    setTimezone(e.target.value)
                                                }
                                                className="min-h-[44px] w-full rounded-[8px] border border-[#454545] bg-[#141414] px-3.5 py-2.5 text-[14px] text-[#ffffff] focus:border-[#6798ff] focus:ring-1 focus:ring-[#6798ff] focus:outline-none"
                                            >
                                                {commonTimezones.map((tz) => (
                                                    <option
                                                        key={tz.value}
                                                        value={tz.value}
                                                        className="bg-[#1e1e1e] text-[#ffffff]"
                                                    >
                                                        {tz.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-[#7c7c7c]">
                                                Jadwal interview dan notifikasi
                                                pengingat akan diselaraskan
                                                dengan zona waktu ini.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="locale-select"
                                                className="block text-[13px] font-medium text-[#a7a7a7]"
                                            >
                                                Bahasa & Format Tanggal
                                            </label>
                                            <select
                                                id="locale-select"
                                                value={locale}
                                                onChange={(e) =>
                                                    setLocale(e.target.value)
                                                }
                                                className="min-h-[44px] w-full rounded-[8px] border border-[#454545] bg-[#141414] px-3.5 py-2.5 text-[14px] text-[#ffffff] focus:border-[#6798ff] focus:ring-1 focus:ring-[#6798ff] focus:outline-none"
                                            >
                                                <option
                                                    value="id-ID"
                                                    className="bg-[#1e1e1e] text-[#ffffff]"
                                                >
                                                    Bahasa Indonesia (id-ID)
                                                </option>
                                                <option
                                                    value="en-US"
                                                    className="bg-[#1e1e1e] text-[#ffffff]"
                                                >
                                                    English (United States -
                                                    en-US)
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card: Preferensi Sasaran Karier */}
                            <Card variant="carbon">
                                <CardHeader>
                                    <CardTitle>
                                        Preferensi Sasaran Karier
                                    </CardTitle>
                                    <CardDescription>
                                        Digunakan oleh AI Career Planner untuk
                                        memberikan rekomendasi yang
                                        dipersonalisasi dan mengukur metrik
                                        analitik mingguan Anda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Target Roles Tags */}
                                    <div className="space-y-2">
                                        <label className="block text-[13px] font-medium text-[#a7a7a7]">
                                            Target Posisi Pekerjaan (Target
                                            Roles)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {targetRoles.map((role) => (
                                                <span
                                                    key={role}
                                                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#313131] bg-[#141414] px-2.5 py-1 text-[13px] text-[#ffffff]"
                                                >
                                                    <span>{role}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveRole(
                                                                role,
                                                            )
                                                        }
                                                        className="text-[#7c7c7c] transition-colors hover:text-[#f87171]"
                                                        aria-label={`Hapus ${role}`}
                                                    >
                                                        <svg
                                                            width="13"
                                                            height="13"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                        >
                                                            <line
                                                                x1="18"
                                                                y1="6"
                                                                x2="6"
                                                                y2="18"
                                                            />
                                                            <line
                                                                x1="6"
                                                                y1="6"
                                                                x2="18"
                                                                y2="18"
                                                            />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={roleInput}
                                                onChange={(e) =>
                                                    setRoleInput(e.target.value)
                                                }
                                                onKeyDown={handleAddRole}
                                                placeholder="Ketik posisi (misal: Frontend Engineer, Tech Lead) lalu tekan Enter"
                                                className="min-h-[44px] flex-1 rounded-[8px] border border-[#454545] bg-[#141414] px-3.5 py-2 text-[14px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:ring-1 focus:ring-[#6798ff] focus:outline-none"
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleAddRole}
                                                className="min-h-[44px]"
                                            >
                                                Tambah
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Preferred Locations Tags */}
                                    <div className="space-y-2">
                                        <label className="block text-[13px] font-medium text-[#a7a7a7]">
                                            Lokasi Preferensi (Preferred
                                            Locations)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {preferredLocations.map((loc) => (
                                                <span
                                                    key={loc}
                                                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#313131] bg-[#141414] px-2.5 py-1 text-[13px] text-[#ffffff]"
                                                >
                                                    <span>{loc}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveLocation(
                                                                loc,
                                                            )
                                                        }
                                                        className="text-[#7c7c7c] transition-colors hover:text-[#f87171]"
                                                        aria-label={`Hapus ${loc}`}
                                                    >
                                                        <svg
                                                            width="13"
                                                            height="13"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                        >
                                                            <line
                                                                x1="18"
                                                                y1="6"
                                                                x2="6"
                                                                y2="18"
                                                            />
                                                            <line
                                                                x1="6"
                                                                y1="6"
                                                                x2="18"
                                                                y2="18"
                                                            />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={locationInput}
                                                onChange={(e) =>
                                                    setLocationInput(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={handleAddLocation}
                                                placeholder="Ketik lokasi (misal: Jakarta, Remote, Bandung) lalu tekan Enter"
                                                className="min-h-[44px] flex-1 rounded-[8px] border border-[#454545] bg-[#141414] px-3.5 py-2 text-[14px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:ring-1 focus:ring-[#6798ff] focus:outline-none"
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleAddLocation}
                                                className="min-h-[44px]"
                                            >
                                                Tambah
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Salary Expectations & Weekly Target */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-1.5">
                                            <label className="block text-[13px] font-medium text-[#a7a7a7]">
                                                Ekspektasi Gaji Min (
                                                {salaryCurrency})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="500000"
                                                value={salaryMin}
                                                onChange={(e) =>
                                                    setSalaryMin(e.target.value)
                                                }
                                                placeholder="Contoh: 12000000"
                                                className="min-h-[44px] w-full rounded-[8px] border border-[#454545] bg-[#141414] px-3.5 py-2.5 text-[14px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:ring-1 focus:ring-[#6798ff] focus:outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-[13px] font-medium text-[#a7a7a7]">
                                                Ekspektasi Gaji Max (
                                                {salaryCurrency})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="500000"
                                                value={salaryMax}
                                                onChange={(e) =>
                                                    setSalaryMax(e.target.value)
                                                }
                                                placeholder="Contoh: 20000000"
                                                className="min-h-[44px] w-full rounded-[8px] border border-[#454545] bg-[#141414] px-3.5 py-2.5 text-[14px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:ring-1 focus:ring-[#6798ff] focus:outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-[13px] font-medium text-[#a7a7a7]">
                                                Target Lamaran / Minggu
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={weeklyTarget}
                                                onChange={(e) =>
                                                    setWeeklyTarget(
                                                        Math.max(
                                                            1,
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 1,
                                                        ),
                                                    )
                                                }
                                                className="min-h-[44px] w-full rounded-[8px] border border-[#454545] bg-[#141414] px-3.5 py-2.5 text-[14px] text-[#ffffff] focus:border-[#6798ff] focus:ring-1 focus:ring-[#6798ff] focus:outline-none"
                                            />
                                            <p className="text-[11px] text-[#7c7c7c]">
                                                Ditampilkan pada widget progress
                                                mingguan di halaman Analitik.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isSavingProfile}
                                    disabled={isLoading}
                                    className="min-h-[44px] w-full px-6 sm:w-auto"
                                >
                                    Simpan Perubahan Profil
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 2: Keamanan & Kata Sandi */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        {securitySuccess && (
                            <div className="flex items-center gap-2.5 rounded-[8px] border border-[#34d399]/40 bg-[#34d399]/10 p-4 text-[13px] text-[#34d399]">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>{securitySuccess}</span>
                            </div>
                        )}

                        {securityError && (
                            <div className="flex items-center gap-2.5 rounded-[8px] border border-[#f87171]/40 bg-[#f87171]/10 p-4 text-[13px] text-[#f87171]">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{securityError}</span>
                            </div>
                        )}

                        <form
                            onSubmit={handleSaveSecurity}
                            className="space-y-6"
                        >
                            <Card variant="carbon">
                                <CardHeader>
                                    <CardTitle>Perbarui Kata Sandi</CardTitle>
                                    <CardDescription>
                                        Pastikan akun Anda menggunakan kata
                                        sandi yang panjang dan unik untuk
                                        menjaga keamanan data lamaran kerja
                                        Anda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="max-w-xl space-y-4">
                                    <Input
                                        id="current-password"
                                        label="Kata Sandi Saat Ini"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        required
                                        placeholder="••••••••"
                                    />

                                    <Input
                                        id="new-password"
                                        label="Kata Sandi Baru (Minimal 8 karakter)"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                    />

                                    <Input
                                        id="confirm-password"
                                        label="Konfirmasi Kata Sandi Baru"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                    />
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isSavingSecurity}
                                    className="min-h-[44px] w-full px-6 sm:w-auto"
                                >
                                    Perbarui Kata Sandi
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 3: Zona Bahaya & Hapus Akun */}
                {activeTab === 'danger' && (
                    <div className="space-y-6">
                        <Card
                            variant="coal"
                            className="border-[#7f1d1d]/60 bg-[#1e1414]/40"
                        >
                            <CardHeader>
                                <div className="flex items-center gap-2 text-[#f87171]">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line
                                            x1="12"
                                            y1="17"
                                            x2="12.01"
                                            y2="17"
                                        />
                                    </svg>
                                    <CardTitle className="text-[#f87171]">
                                        Penghapusan Akun Pengguna
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-[#a7a7a7]">
                                    Tindakan ini bersifat destruktif dan
                                    permanen. Harap baca secara saksama sebelum
                                    melanjutkan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-[14px] leading-relaxed text-[#ffffff]">
                                    Sesuai dengan spesifikasi keamanan{' '}
                                    <span className="font-mono text-[#6798ff]">
                                        FR-AUTH-003
                                    </span>{' '}
                                    dan privasi data pengguna, menghapus akun
                                    akan mengeksekusi langkah-langkah berikut
                                    secara otomatis:
                                </p>
                                <ul className="space-y-2 text-[13px] text-[#a7a7a7]">
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#f87171]">
                                            •
                                        </span>
                                        <span>
                                            Memutuskan dan mencabut akses
                                            integrasi akun Gmail (Google OAuth).
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#f87171]">
                                            •
                                        </span>
                                        <span>
                                            Membatalkan seluruh sesi web login
                                            aktif dan menghapus personal access
                                            token Sanctum.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#f87171]">
                                            •
                                        </span>
                                        <span>
                                            Menghapus data lamaran kerja,
                                            riwayat status, jadwal interview,
                                            dan preferensi karier Anda.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#f87171]">
                                            •
                                        </span>
                                        <span>
                                            Menonaktifkan pengiriman email
                                            peringatan berkala dan rekomendasi
                                            follow-up.
                                        </span>
                                    </li>
                                </ul>

                                <div className="pt-4">
                                    <Button
                                        type="button"
                                        variant="danger"
                                        onClick={() => {
                                            setDeletePassword('');
                                            setDeleteError(null);
                                            setShowDeleteModal(true);
                                        }}
                                        className="min-h-[44px]"
                                    >
                                        Hapus Akun Saya Selamanya
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Modal Konfirmasi Hapus Akun */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-dialog-title"
                >
                    <div className="relative w-full max-w-md rounded-[8px] border border-[#7f1d1d] bg-[#141414] p-6 text-[#ffffff] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#313131] pb-4">
                            <h2
                                id="delete-dialog-title"
                                className="text-[17px] font-semibold text-[#f87171]"
                            >
                                Konfirmasi Penghapusan Akun
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#7c7c7c] transition-colors hover:bg-[#1e1e1e] hover:text-[#ffffff]"
                                aria-label="Tutup dialog"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <form
                            onSubmit={handleDeleteAccount}
                            className="mt-4 space-y-4"
                        >
                            <p className="text-[13px] leading-relaxed text-[#a7a7a7]">
                                Untuk mengonfirmasi bahwa Anda adalah pemilik
                                sah akun ini, silakan masukkan kata sandi akun
                                Anda.
                            </p>

                            {deleteError && (
                                <div className="rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[12px] text-[#f87171]">
                                    {deleteError}
                                </div>
                            )}

                            <Input
                                id="delete-confirm-password"
                                label="Kata Sandi Akun"
                                type="password"
                                value={deletePassword}
                                onChange={(e) =>
                                    setDeletePassword(e.target.value)
                                }
                                required
                                placeholder="Masukkan kata sandi Anda"
                                autoFocus
                            />

                            <div className="flex justify-end gap-3 border-t border-[#313131] pt-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeletingAccount}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="danger"
                                    isLoading={isDeletingAccount}
                                    disabled={!deletePassword}
                                >
                                    Ya, Hapus Akun
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
