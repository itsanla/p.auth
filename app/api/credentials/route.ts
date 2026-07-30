import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getDbCredentials, insertDbCredential, deleteDbCredential } from "@/lib/db";

export async function GET(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const dbAccs = getDbCredentials();
        const accounts = dbAccs.map((acc) => ({
            email: acc.email,
            key: acc.secret_key,
            backupCodes: acc.backup_codes ? acc.backup_codes.split(",").map(c => c.trim()).filter(Boolean) : [],
        }));
        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Failed to fetch credentials:", error);
        return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, key, backupCodes } = body;

        if (!email || !key) {
            return NextResponse.json({ error: "Email and key are required" }, { status: 400 });
        }

        const codesStr = Array.isArray(backupCodes)
            ? backupCodes.map((c: string) => c.trim()).filter(Boolean).join(",")
            : (backupCodes || "");

        insertDbCredential(email, key, codesStr);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save credential:", error);
        return NextResponse.json({ error: "Failed to save credential" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        deleteDbCredential(email);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete credential:", error);
        return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }
}
