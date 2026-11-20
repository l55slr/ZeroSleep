"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { joinWaitlist } from "./waitlist-actions";
import type { WaitlistState } from "@/lib/waitlist";
import styles from "./page.module.css";

const initialState: WaitlistState = { status: "idle", message: "" };

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [clientError, setClientError] = useState("");
  const [edited, setEdited] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previous: WaitlistState, data: FormData): Promise<WaitlistState> => {
      try {
        return await joinWaitlist(previous, data);
      } catch {
        return {
          status: "error",
          message: "We couldn’t connect. Check your connection and try again.",
        };
      }
    },
    initialState,
  );

  const message = clientError || (!edited && state.status === "error" ? state.message : "");
  const invalid = Boolean(clientError || (!edited && state.field === "email"));

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    else if (state.field === "email") inputRef.current?.focus();
  }, [state]);

  return (
    <div className={styles.signup}>
      {state.status === "success" ? (
        <div className={styles.success}>
          <span className={styles.successIcon}><Check size={20} aria-hidden="true" /></span>
          <h2 ref={successRef} tabIndex={-1}>You’re on the list.</h2>
          <p>We’ll email you when ZeroSleep is ready.</p>
        </div>
      ) : (
        <form
          action={formAction}
          noValidate
          aria-label="Join the ZeroSleep waitlist"
          aria-busy={pending}
          onSubmit={(event) => {
            if (pending) {
              event.preventDefault();
              return;
            }
            setEdited(false);
            if (!inputRef.current?.checkValidity()) {
              event.preventDefault();
              setClientError("Enter a valid email address, like you@example.com.");
              inputRef.current?.focus();
              return;
            }
            setClientError("");
          }}
        >
          <label className={styles.label} htmlFor="waitlist-email">Email address</label>
          <div className={styles.formRow}>
            <input
              ref={inputRef}
              id="waitlist-email"
              className={styles.email}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Your email address"
              aria-label="Email address"
              aria-invalid={invalid}
              aria-describedby="waitlist-message waitlist-consent"
              maxLength={254}
              required
              readOnly={pending}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setClientError("");
                setEdited(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !pending && !event.nativeEvent.isComposing) {
                  setEmail("");
                  setClientError("");
                  setEdited(true);
                }
              }}
            />
            <button className={styles.joinButton} type="submit" disabled={pending}>
              {pending ? "Joining…" : "Join the waitlist"}
              {pending ? <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </div>
          <div className={styles.honeypot} aria-hidden="true" inert>
            <label htmlFor="waitlist-company">Company</label>
            <input id="waitlist-company" name="company" type="text" autoComplete="off" tabIndex={-1} />
          </div>
          <p id="waitlist-message" className={styles.error} role="alert">{message}</p>
          <p id="waitlist-consent" className={styles.consent}>
            Just an email when we’re ready. No account needed.
          </p>
        </form>
      )}
    </div>
  );
}
