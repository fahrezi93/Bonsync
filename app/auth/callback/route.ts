import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function getSafeRedirect(origin: string, next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return `${origin}/login?verified=1`;
  }

  return `${origin}${next}`;
}

function redirectWithCookies(url: string, cookiesToSet: CookieToSet[]) {
  const response = NextResponse.redirect(url);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

function getLoginErrorRedirect(
  origin: string,
  errorCode: string | null,
  errorDescription: string | null,
) {
  const loginUrl = new URL("/login", origin);
  const description = errorDescription?.toLowerCase() ?? "";

  if (errorCode === "otp_expired" || description.includes("expired")) {
    loginUrl.searchParams.set("error", "auth_link_expired");
    return loginUrl.toString();
  }

  loginUrl.searchParams.set("error", "auth_callback_failed");
  return loginUrl.toString();
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const authError = searchParams.get("error");
  const authErrorCode = searchParams.get("error_code");
  const authErrorDescription = searchParams.get("error_description");
  const next = searchParams.get("next");
  const successRedirect = getSafeRedirect(origin, next);

  if (authError || authErrorCode || authErrorDescription) {
    console.error("[auth/callback] Supabase returned error:", {
      authError,
      authErrorCode,
      authErrorDescription,
    });

    return NextResponse.redirect(
      getLoginErrorRedirect(origin, authErrorCode, authErrorDescription),
    );
  }

  const cookieStore = await cookies();
  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(newCookies) {
          cookiesToSet.push(...newCookies);
          newCookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  // Handle PKCE flow (email link klik mengandung "code")
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return redirectWithCookies(successRedirect, cookiesToSet);
      }
      // Force user to login manually after verifying email
      await supabase.auth.signOut();
      const userEmail = data.user?.email || "";
      const verifyUrl = new URL("/login", origin);
      verifyUrl.searchParams.set("verified", "1");
      if (userEmail) verifyUrl.searchParams.set("email", userEmail);
      return redirectWithCookies(verifyUrl.toString(), cookiesToSet);
    }

    if (error.message.toLowerCase().includes("code verifier")) {
      console.error(
        "[auth/callback] email verified, session exchange skipped:",
        error.message,
      );
      return NextResponse.redirect(`${origin}/login?verified=1`);
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // Handle OTP/token_hash flow (alternatif Supabase email flow)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "email" | "recovery",
    });
    if (!error) {
      if (type === "recovery") {
        return redirectWithCookies(successRedirect, cookiesToSet);
      }
      // Force user to login manually after verifying email
      await supabase.auth.signOut();
      const userEmail = data.user?.email || "";
      const verifyUrl = new URL("/login", origin);
      verifyUrl.searchParams.set("verified", "1");
      if (userEmail) verifyUrl.searchParams.set("email", userEmail);
      return redirectWithCookies(verifyUrl.toString(), cookiesToSet);
    }
    console.error("[auth/callback] verifyOtp error:", error.message);
  }

  // Gagal — redirect ke login dengan pesan error
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`,
  );
}
