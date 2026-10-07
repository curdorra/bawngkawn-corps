"use client";

import { useState } from "react";

type State = "idle" | "sending" | "done" | "error" | "unavailable";

export function CounsellingForm({ phone }: { phone: string }) {
  const [state, setState] = useState<State>("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setState("sending");
    try {
      const res = await fetch("/api/counselling", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.status === 503) return setState("unavailable");
      if (!res.ok) return setState("error");
      form.reset();
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done")
    return (
      <div className="form-done">
        <h3>Thank you for reaching out.</h3>
        <p>Your message has reached us, and it is only seen by the people who care for this. Someone will get in touch with you privately as soon as they can.</p>
        <p>If things feel unbearable before then, please call the helpline on this page, any time of the day or night.</p>
      </div>
    );

  return (
    <form className="care-form" onSubmit={submit}>
      <label>
        Your name <span>(a first name is fine)</span>
        <input name="name" autoComplete="given-name" maxLength={80} />
      </label>
      <label>
        How can we reach you? <span>(phone, WhatsApp or email)</span>
        <input name="contact" required maxLength={120} />
      </label>
      <label>
        What would you like us to know? <span>(share as much or as little as you like)</span>
        <textarea name="message" rows={6} maxLength={2000} />
      </label>
      <label className="check">
        <input type="checkbox" name="consent" value="yes" required />I am happy for someone from the corps to contact me privately.
      </label>
      {/* Hidden from people; bots tend to fill it in. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hp" />
      <button className="btn btn-red" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send privately"}
      </button>
      {state === "error" && <p className="form-err">Sorry, that didn&apos;t send. Please try again, or call us on {phone}.</p>}
      {state === "unavailable" && <p className="form-err">This form isn&apos;t working yet. Please call us on {phone}, or speak to any of our leaders.</p>}
    </form>
  );
}
