import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Artifact } from "@/components/landing/Artifact";
import { Depth } from "@/components/landing/Depth";
import { Faq } from "@/components/landing/Faq";
import { HeroLock } from "@/components/landing/HeroLock";
import { Relay } from "@/components/landing/Relay";
import { Scene } from "@/components/landing/Scene";
import { Walkthrough } from "@/components/landing/Walkthrough";
import { Shift } from "@/components/landing/Shift";
import { LockMark } from "@/components/lock/LockMark";
import { SlideToLock } from "@/components/SlideToLock";
import { INVITE_PARAM } from "@/lib/lock-invite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lock" },
      { name: "description", content: "You already know. Lock is where you say it." },
      { property: "og:title", content: "Lock" },
      { property: "og:description", content: "You already know. You just haven't decided." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b0b0d" },
    ],
  }),
  // An invitation must never land on marketing. Links built before the product
  // moved to /lock still point here, so they are forwarded intact.
  beforeLoad: ({ location }) => {
    const invite = (location.search as Record<string, unknown>)[INVITE_PARAM];
    if (typeof invite === "string" && invite) {
      throw redirect({ href: `/lock?${INVITE_PARAM}=${encodeURIComponent(invite)}` });
    }
  },
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [locked, setLocked] = useState(false);
  const start = () => void navigate({ to: "/lock" });

  /**
   * The closing surface catches light where the pointer is. Desktop only —
   * there is no hover on a phone, and the two custom properties are the whole
   * cost of it.
   */
  const trackPointer = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    e.currentTarget.style.setProperty("--py", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <>
      <div className="lock-ground" aria-hidden="true" />

      <main className="landing">
        <header className="landing-chrome">
          <LockMark progress={locked ? 1 : 0} />
        </header>

        <section className="hero">
          <h1 className="hero-title">
            Make the decision.
            <span className="hero-title-dim"> Then lock it.</span>
          </h1>

          <p className="hero-sub">
            Tell Lock what you are stuck on. It works out what the decision is really about, then
            hands you the control to commit to it.
          </p>

          <button type="button" onClick={start} className="action action--primary hero-cta">
            Try Lock
          </button>

          <HeroLock onLocked={() => setLocked(true)} />

          <p className="hero-after" data-shown={locked || undefined} aria-live="polite">
            That is the last thing that happens. Everything before it exists to get you there.
          </p>
        </section>

        <Walkthrough />

        <Shift />

        <Scene
          eyebrow="How long it takes"
          title={
            <>
              As long as the decision deserves.
              <span className="scene-title-dim"> No longer.</span>
            </>
          }
        >
          <p className="scene-body">
            An easy call is one exchange. A hard one opens up. You are never walked through a
            questionnaire that was written before it met you.
          </p>
          <Depth />
        </Scene>

        <Scene
          eyebrow="What you keep"
          title={
            <>
              A decision, sealed.
              <span className="scene-title-dim"> With the reason it held.</span>
            </>
          }
        >
          <Artifact />
        </Scene>

        <Scene
          eyebrow="When it is not yours alone"
          title={
            <>
              Hand it to someone else.
              <span className="scene-title-dim"> Let them lock it.</span>
            </>
          }
        >
          <p className="scene-body">
            Send a decision the way you would send a message. They open Lock already holding it, and
            what they answer stays theirs.
          </p>
          <Relay />
        </Scene>

        <Scene eyebrow="What it costs" title="Nothing, for now.">
          <p className="scene-body">
            Lock is free while it is being built. There is no account and no sign-in — you open it
            and decide something.
          </p>
        </Scene>

        <Scene eyebrow="Before you start" title="Straight answers.">
          <Faq />
        </Scene>

        <section className="closing" onPointerMove={trackPointer}>
          <p className="closing-line">You have been carrying it long enough.</p>
          <SlideToLock label="slide to begin" confirmedLabel="open" onConfirm={start} />
          <button type="button" onClick={start} className="closing-plain">
            Try Lock
          </button>
        </section>
      </main>
    </>
  );
}
