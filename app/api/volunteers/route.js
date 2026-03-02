import { NextResponse } from "next/server";
import { createVolunteer } from "../../../lib/volunteers";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await createVolunteer({ email, emailSignup: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to submit email." }, { status: 500 });
  }
}
