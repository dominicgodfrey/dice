// Privacy policy (PLAN.md D22). Phase 3 adds the crash-reporting and
// analytics providers here when they are wired in (D21).

import { A, H, P, Page } from "../src/chrome/Page";

export default function Privacy() {
  return (
    <Page title="Privacy">
      <P>Last updated 11 September 2026.</P>
      <H>What Dice stores</H>
      <P>
        Your tile layout and settings, such as which tiles you show, their
        order, the laundry building and shuttle stop you pick, and which links
        you have added. This lives on your device. Nothing is sent to us.
      </P>
      <H>Accounts</H>
      <P>
        There are none yet. When accounts arrive they will be limited to
        brandeis.edu addresses and will hold only the settings above, so they
        can follow you between devices.
      </P>
      <H>Location</H>
      <P>
        Dice never asks for your location except on the Emergency page, when you
        tap Find my location. It is used once, to write a text message with a
        map link, and is not stored or sent anywhere else. The Sky tile uses a
        fixed campus coordinate, not yours.
      </P>
      <H>Crash reports and analytics</H>
      <P>
        Not yet. When we add them this page will name each provider and say
        exactly what it receives, before the build that includes them is
        released.
      </P>
      <H>Third-party links</H>
      <P>
        Links open other services in your browser or their app. Their privacy
        policies apply there, not this one.
      </P>
      <H>Questions</H>
      <P>
        Open an issue at{" "}
        <A href="https://github.com/dominicgodfrey/dice/issues">
          github.com/dominicgodfrey/dice
        </A>
        .
      </P>
    </Page>
  );
}
