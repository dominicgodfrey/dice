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
      <H>Crash reports</H>
      <P>
        When a build has crash reporting turned on, errors are sent to Sentry
        (sentry.io). Each report carries the error, the app version, your
        platform and device model, and the screens you visited just before. It
        never carries your name, email, or location. Builds without a Sentry key
        send nothing.
      </P>
      <H>Analytics</H>
      <P>
        When a build has analytics turned on, Dice sends PostHog (posthog.com)
        which screens are opened and a few named events, such as a tile being
        expanded, with the app version and platform. There is no session
        recording and no automatic capture of what you tap or type. Builds
        without a PostHog key send nothing.
      </P>
      <H>Bug reports</H>
      <P>
        A bug report you send goes to our server and is emailed to the team. It
        contains what you wrote, the email you chose to give, your platform, app
        version and, on the web, your browser. Reports are kept until the bug is
        fixed.
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
