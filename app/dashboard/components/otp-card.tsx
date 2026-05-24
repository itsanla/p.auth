"use client";

import { useState, useEffect, useCallback } from "react";
import * as OTPAuth from "otpauth";
import BackupModal from "./backup-modal";

interface OTPCardProps {
    email: string;
    secretKey: string;
    backupCodes: string[];
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    isSavingTags: boolean;
}

export default function OTPCard({
    email,
    secretKey,
    backupCodes,
    tags,
    onTagsChange,
    isSavingTags,
}: OTPCardProps) {
    const [otp, setOtp] = useState("");
    const [timeRemaining, setTimeRemaining] = useState(30);
    const [copied, setCopied] = useState(false);
    const [showBackup, setShowBackup] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const generateOTP = useCallback(() => {
        try {
            const totp = new OTPAuth.TOTP({
                issuer: "Google",
                label: email,
                algorithm: "SHA1",
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(secretKey.toUpperCase()),
            });
            return totp.generate();
        } catch {
            return "------";
        }
    }, [email, secretKey]);

    useEffect(() => {
        const updateOTP = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = 30 - (now % 30);
            setTimeRemaining(remaining);
            setOtp(generateOTP());
        };

        updateOTP();
        const interval = setInterval(updateOTP, 1000);
        return () => clearInterval(interval);
    }, [generateOTP]);

    const copyOTP = async () => {
        try {
            await navigator.clipboard.writeText(otp);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const progress = (timeRemaining / 30) * 100;
    const isExpiring = timeRemaining <= 5;

    const commitTagInput = () => {
        const nextTags = tagInput
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean);

        if (nextTags.length === 0) {
            setTagInput("");
            return;
        }

        const merged = Array.from(new Set([...tags, ...nextTags]));
        onTagsChange(merged);
        setTagInput("");
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <>
            <div className="group relative bg-[var(--ios-surface)] rounded-3xl border border-[var(--ios-border)] p-6 transition-all duration-300 shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] animate-in zoom-in-95">
                {/* Email Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--ios-accent-soft)] flex items-center justify-center text-[var(--ios-accent)] font-semibold text-sm">
                        {email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-semibold truncate">{email}</p>
                        <p className="text-slate-500 text-xs">Google Authenticator</p>
                    </div>
                </div>

                {/* OTP Display */}
                <button
                    onClick={copyOTP}
                    className="w-full py-4 px-6 bg-[var(--ios-surface-alt)] rounded-2xl mb-4 transition-all duration-200 active:scale-[0.98] group/btn border border-transparent hover:border-[var(--ios-border)]"
                >
                    {copied ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-500">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span className="text-lg font-semibold">Copied!</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span
                                className={`font-code text-3xl font-semibold tracking-[0.3em] ${isExpiring ? "text-amber-500 animate-pulse" : "text-slate-900"
                                    }`}
                            >
                                {otp.slice(0, 3)} {otp.slice(3)}
                            </span>
                            <svg
                                className="w-5 h-5 text-slate-400 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    )}
                </button>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Expires in</span>
                        <span className={isExpiring ? "text-amber-500" : ""}>
                            {timeRemaining}s
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-linear ${isExpiring
                                    ? "bg-gradient-to-r from-amber-400 to-rose-500"
                                    : "bg-[var(--ios-accent)]"
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Backup Codes Button */}
                <button
                    onClick={() => setShowBackup(true)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-900/10 rounded-2xl text-sm text-white transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                    </svg>
                    View Backup Codes
                </button>

                {/* Tags */}
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            Tags
                        </span>
                        {isSavingTags ? (
                            <span className="text-xs text-slate-400">Saving...</span>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.length > 0 ? (
                            tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--ios-accent-soft)] text-[var(--ios-accent)]"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="text-[var(--ios-accent)] opacity-70 hover:opacity-100"
                                        aria-label={`Remove ${tag}`}
                                    >
                                        x
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-400">No tags yet.</span>
                        )}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                                event.preventDefault();
                                commitTagInput();
                            }
                        }}
                        onBlur={commitTagInput}
                        placeholder="Add tag (aws, groq, claude)"
                        className="w-full px-3 py-2 bg-[var(--ios-surface-alt)] border border-[var(--ios-border)] rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--ios-accent)]"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">
                        Press Enter or comma to add.
                    </p>
                </div>
            </div>

            <BackupModal
                email={email}
                backupCodes={backupCodes}
                isOpen={showBackup}
                onClose={() => setShowBackup(false)}
            />
        </>
    );
}
