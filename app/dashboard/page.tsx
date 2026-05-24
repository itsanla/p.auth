import { parseGmailData } from "@/lib/gmail-data";
import OTPGrid from "./components/otp-grid";
import LogoutButton from "./components/logout-button";

export default function DashboardPage() {
    const accounts = parseGmailData();

    return (
        <div className="min-h-screen text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--ios-surface-alpha)] backdrop-blur-xl border-b border-[var(--ios-border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]">
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-slate-900">
                                    Authenticator
                                </h1>
                                <p className="text-xs text-slate-500">
                                    {accounts.length} account{accounts.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <OTPGrid accounts={accounts} />
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-slate-400 text-xs">
                Stateless Authenticator Dashboard • Secure • Edge-Ready
            </footer>
        </div>
    );
}
