import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * GmailAuthPage
 * - Redirects to Google for auth on button click (only then).
 * - When Google returns ?code=..., posts it to /auth/callback once.
 * - Removes ?code=... from URL using history.replaceState (no react-router navigation).
 * - Shows success (step 3) on same page.
 * - Protects against infinite loops and double-processing.
 */
export default function GmailAuthPage() {
  const [callbackResponse, setCallbackResponse] = useState(null); // Step 2 result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step3Visible, setStep3Visible] = useState(false);

  const location = useLocation();

  // make sure we only process the "code" once per mount
  const processedRef = useRef(false);

  // avoid calling setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // replace with your real JWT
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYWEzNjc5ZS1kMGUwLTQ1OGItYTIyNy05YmI1MDBmZGVlYWMiLCJjb21wYW55SWQiOiI5NjUzYTI1NS01OTFjLTQ4OTYtOGY2ZS0zNGEyYmM3MzE1NmQiLCJlbWFpbCI6ImFkbWluQHRlY2hjb3JwLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTM3MjI1NCwiZXhwIjoxNzU5NDU4NjU0fQ.IE9TE6rfwORQFkc9czMYdH_x7FQgjQVFatUx-554sZU";
  const API_BASE = "http://localhost:3001";

  // Step 1 - when user clicks, fetch auth URL and redirect to Google
  const connectGmail = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/emails/auth/url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Failed to fetch auth url: ${errBody}`);
      }
      const data = await res.json();
      if (!data?.authUrl) throw new Error("Auth URL missing in response");
      // Redirect the browser to Google OAuth (this leaves your SPA)
      window.location.href = data.authUrl;
    } catch (err) {
      console.error("connectGmail error:", err);
      if (mountedRef.current) setError(err.message || "Failed to start Gmail OAuth");
    }
  };

  // Step 2 - handle Google redirect ?code=... (run once only)
  useEffect(() => {
    // If already processed, skip
    if (processedRef.current) return;

    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("code");
    if (!code) return;

    processedRef.current = true; // ensure we don't process again
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/emails/auth/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        });

        // parse body first (safer)
        const body = await res.json().catch(() => null);

        if (!res.ok) {
          const message = body?.error || body?.message || `Callback failed (${res.status})`;
          throw new Error(message);
        }

        if (mountedRef.current) {
          setCallbackResponse(body);
          setStep3Visible(true);
        }

        // remove ?code=... and Keep the SPA route unchanged (no react-router navigation)
        // This avoids reloading component logic that might re-trigger processing.
        const cleanUrl = window.location.pathname + window.location.hash;
        try {
          window.history.replaceState(null, "", cleanUrl);
        } catch (err) {
          // ignore - replaceState can fail in some environments
        }
      } catch (err) {
        console.error("Error during callback exchange:", err);
        if (mountedRef.current) setError(err.message || "Callback failed");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [location.search, token]);

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">🔑 Gmail OAuth Flow (no navigation)</h1>

      {/* Step 1 Button */}
      {!step3Visible && (
        <button
          onClick={connectGmail}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl"
        >
          Connect Gmail
        </button>
      )}

      {loading && <p className="text-gray-600">⏳ Exchanging code for tokens...</p>}
      {error && <p className="text-red-600 font-semibold">❌ {error}</p>}

      {/* Step 3 Success View (renders inside same page) */}
      {step3Visible && callbackResponse && (
        <div className="mt-6 p-6 bg-green-100 rounded-lg">
          <h2 className="text-2xl font-bold text-green-800">🎉 Gmail OAuth Successful!</h2>
          <p className="mt-2 text-green-700">Your Gmail account is now connected (all on this page).</p>

          <h3 className="mt-4 font-semibold">Callback Response:</h3>
          <pre className="bg-white p-3 rounded-lg overflow-x-auto break-all">
            {JSON.stringify(callbackResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
