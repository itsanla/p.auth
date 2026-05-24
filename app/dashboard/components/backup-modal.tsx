"use client";

import { useState, useEffect } from "react";

interface BackupModalProps {
    email: string;
    backupCodes: string[];
    isOpen: boolean;
    onClose: () => void;
}

export default function BackupModal({
    email,
    backupCodes,
    isOpen,
    onClose,
}: BackupModalProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [usedCodes, setUsedCodes] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Load used codes from API
    useEffect(() => {
        if (isOpen) {
            fetch("/api/used-codes")
                .then((res) => res.json())
                .then((data) => {
                    if (data[email]) {
                        setUsedCodes(new Set(data[email]));
                    }
                })
                .catch(() => {});
        }
    }, [isOpen, email]);

    const copyCode = async (code: string, index: number) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const toggleUsed = async (index: number) => {
        const newSet = new Set(usedCodes);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setUsedCodes(newSet);

        // Save to API + GitHub
        setIsSaving(true);
        try {
            await fetch("/api/used-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    usedIndexes: Array.from(newSet),
                }),
            });
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[var(--ios-surface)] rounded-3xl border border-[var(--ios-border)] p-6 w-full max-w-md shadow-[0_30px_80px_rgba(15,23,42,0.15)] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Backup Codes</h3>
                        <p className="text-sm text-slate-500 truncate max-w-[280px]">
                            {email}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--ios-surface-alt)] transition-colors"
                    >
                        <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Backup Codes Grid */}
                {backupCodes.length > 0 ? (
                    <div className="space-y-2">
                        {backupCodes.map((code, index) => {
                            const isUsed = usedCodes.has(index);
                            return (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between rounded-2xl border transition-all ${
                                        isUsed
                                            ? "border-rose-200 bg-rose-50"
                                            : "border-[var(--ios-border)] bg-[var(--ios-surface-alt)]"
                                    }`}
                                >
                                    <button
                                        onClick={() => copyCode(code, index)}
                                        className="flex-1 px-4 py-3 text-left"
                                    >
                                        {copiedIndex === index ? (
                                            <span className="text-emerald-500 text-sm font-semibold">
                                                Copied!
                                            </span>
                                        ) : (
                                            <span
                                                className={`font-code text-base ${
                                                    isUsed
                                                        ? "text-rose-500 line-through"
                                                        : "text-slate-900"
                                                }`}
                                            >
                                                {code}
                                            </span>
                                        )}
                                    </button>
                                    <label className="flex items-center gap-2 pr-4 text-xs text-slate-500">
                                        <input
                                            type="checkbox"
                                            checked={isUsed}
                                            onChange={() => toggleUsed(index)}
                                            className="h-4 w-4 accent-[var(--ios-accent)]"
                                        />
                                        Used
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        No backup codes available
                    </div>
                )}

                {/* Footer */}
                <p className="mt-6 text-xs text-slate-400 text-center">
                    {isSaving ? "Saving..." : "Tap a code to copy it."}
                </p>
            </div>
        </div>
    );
}
