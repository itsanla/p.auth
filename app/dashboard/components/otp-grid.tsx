"use client";

import { useEffect, useMemo, useState } from "react";
import OTPCard from "./otp-card";
import type { GmailAccount } from "@/types";

interface OTPGridProps {
    accounts: GmailAccount[];
}

type TagMap = Record<string, string[]>;

const normalizeTags = (tags: string[]) => {
    const unique = new Map<string, string>();
    tags.forEach((tag) => {
        const clean = tag.trim().toLowerCase();
        if (clean) {
            unique.set(clean, clean);
        }
    });
    return Array.from(unique.values());
};

export default function OTPGrid({ accounts }: OTPGridProps) {
    const [query, setQuery] = useState("");
    const [tagMap, setTagMap] = useState<TagMap>({});
    const [savingTags, setSavingTags] = useState<Record<string, boolean>>({});
    const [isLoadingTags, setIsLoadingTags] = useState(false);

    useEffect(() => {
        let isActive = true;
        setIsLoadingTags(true);
        fetch("/api/account-tags")
            .then((res) => (res.ok ? res.json() : {}))
            .then((data) => {
                if (isActive && data) {
                    const normalized: TagMap = {};
                    Object.entries(data as TagMap).forEach(([email, tags]) => {
                        const list = Array.isArray(tags) ? tags : [];
                        normalized[email] = normalizeTags(list);
                    });
                    setTagMap(normalized);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (isActive) {
                    setIsLoadingTags(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, []);

    const handleTagsChange = async (email: string, nextTags: string[]) => {
        const normalized = normalizeTags(nextTags);
        setTagMap((prev) => ({ ...prev, [email]: normalized }));
        setSavingTags((prev) => ({ ...prev, [email]: true }));

        try {
            await fetch("/api/account-tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, tags: normalized }),
            });
        } catch {
            // No-op: keep optimistic UI
        } finally {
            setSavingTags((prev) => ({ ...prev, [email]: false }));
        }
    };

    const filteredAccounts = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) {
            return accounts;
        }

        return accounts.filter((account) => {
            const emailMatch = account.email.toLowerCase().includes(trimmed);
            const tags = tagMap[account.email] || [];
            const tagMatch = tags.some((tag) => tag.toLowerCase().includes(trimmed));
            return emailMatch || tagMatch;
        });
    }, [accounts, query, tagMap]);

    if (accounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-[var(--ios-surface)] border border-[var(--ios-border)] flex items-center justify-center mb-4 shadow-sm">
                    <svg
                        className="w-10 h-10 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No accounts found
                </h3>
                <p className="text-slate-500 text-center max-w-sm">
                    Configure your GMAIL{accounts.length + 1}_USERNAME and
                    GMAIL{accounts.length + 1}_AUTHENTICATOR environment variables to add
                    accounts.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                    <label className="text-sm text-slate-500">Search</label>
                    <div className="relative mt-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by email or tag"
                            className="w-full px-4 py-3 bg-[var(--ios-surface)] border border-[var(--ios-border)] rounded-2xl text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ios-accent)]"
                        />
                        {query ? (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    Clear
                                </button>
                        ) : null}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Search by email or any connected service tag.
                    </p>
                </div>
                <div className="text-sm text-slate-500">
                    {isLoadingTags
                        ? "Syncing tags..."
                        : `${filteredAccounts.length} of ${accounts.length} accounts`}
                </div>
            </div>

            {filteredAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-[var(--ios-surface)] border border-[var(--ios-border)] flex items-center justify-center mb-4 shadow-sm">
                        <svg
                            className="w-8 h-8 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No matching accounts
                    </h3>
                    <p className="text-slate-500 text-center max-w-sm">
                        Try a different keyword or clear the search.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAccounts.map((account) => (
                        <OTPCard
                            key={account.email}
                            email={account.email}
                            secretKey={account.key}
                            backupCodes={account.backupCodes}
                            tags={tagMap[account.email] || []}
                            onTagsChange={(tags) => handleTagsChange(account.email, tags)}
                            isSavingTags={Boolean(savingTags[account.email])}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
