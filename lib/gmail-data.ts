import type { GmailAccount } from "@/types";
import { getDbCredentials, insertDbCredential } from "./db";

export function parseGmailData(): GmailAccount[] {
    // 1. Fetch credentials from SQLite
    let dbAccs = getDbCredentials();

    // 2. If SQLite is empty, check environment variables to seed the database
    if (dbAccs.length === 0) {
        const env = process.env;
        const envAccounts: GmailAccount[] = [];

        // Find all GMAIL{number}_USERNAME entries
        Object.keys(env).forEach((key) => {
            const match = key.match(/^GMAIL(\d+)_USERNAME$/);
            if (match) {
                const num = match[1];
                const email = env[`GMAIL${num}_USERNAME`] || "";
                const secretKey = env[`GMAIL${num}_AUTHENTICATOR`] || "";
                const codes = env[`GMAIL${num}_BACKUP_CODES`] || "";

                if (email && secretKey) {
                    envAccounts.push({
                        email,
                        key: secretKey,
                        backupCodes: codes.split(",").map((c) => c.trim()).filter(Boolean),
                    });
                }
            }
        });

        if (envAccounts.length > 0) {
            console.log(`Seeding ${envAccounts.length} credentials from env variables into SQLite database...`);
            envAccounts.forEach((acc) => {
                try {
                    insertDbCredential(acc.email, acc.key, acc.backupCodes.join(","));
                } catch (err) {
                    console.error(`Failed to seed credential for ${acc.email}:`, err);
                }
            });
            // Re-fetch to ensure database state is returned
            dbAccs = getDbCredentials();
        }
    }

    // 3. Map db accounts to GmailAccount interface
    const accounts: GmailAccount[] = dbAccs.map((acc) => ({
        email: acc.email,
        key: acc.secret_key,
        backupCodes: acc.backup_codes ? acc.backup_codes.split(",").map((c) => c.trim()).filter(Boolean) : [],
    }));

    // Sort by email for consistent ordering
    return accounts.sort((a, b) => a.email.localeCompare(b.email));
}
