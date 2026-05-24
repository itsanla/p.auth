import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const keys = await redis.keys("account-tags:*");
        const data: Record<string, string[]> = {};

        for (const key of keys) {
            const email = key.replace("account-tags:", "");
            const tags = await redis.get<string[]>(key);
            if (tags) {
                data[email] = tags;
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Redis error:", error);
        return NextResponse.json({}, { status: 200 });
    }
}

export async function POST(request: NextRequest) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, tags } = body;

        if (!email || !Array.isArray(tags)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const cleanedTags = tags
            .map((tag: string) => tag.trim())
            .filter(Boolean);

        await redis.set(`account-tags:${email}`, cleanedTags);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Redis error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
