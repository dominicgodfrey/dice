// About, with the disclaimer (PLAN.md D22).

import Constants from "expo-constants";
import { A, H, P, Page } from "../src/chrome/Page";

export default function About() {
  const version = Constants.expoConfig?.version ?? "dev";
  return (
    <Page title="About Dice">
      <P>
        Dice is a student-made app for life at Brandeis: one home screen of
        live, glanceable tiles, with every other campus service one tap or one
        search away.
      </P>
      <H>Not affiliated</H>
      <P>
        Dice is an independent project. It is not affiliated with, endorsed by,
        or maintained by Brandeis University, and it is not Branda, the
        university&apos;s own app. Names of campus services appear only to
        describe where a link goes.
      </P>
      <H>Open source</H>
      <P>
        The code is at{" "}
        <A href="https://github.com/dominicgodfrey/dice">
          github.com/dominicgodfrey/dice
        </A>{" "}
        under the MIT license.
      </P>
      <H>Version</H>
      <P>{version}</P>
    </Page>
  );
}
