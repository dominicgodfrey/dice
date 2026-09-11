// Map tile (PLAN.md D39): a still of campus collapsed; the full map with
// pinch and pan expanded. Photo checkpoints appear at the closest zoom as
// they are taken.

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { CampusMap } from "../../map/CampusMap";
import { KIND_LABELS } from "../../map/campus";
import { useSources } from "../../sources/SourcesProvider";
import { Text } from "../../ui/Text";
import { space } from "../../ui/theme";
import {
  CollapsedShell,
  ExpandedShell,
  Row,
  Section,
  t,
  useClosePan,
} from "../shells";

export function MapCollapsed() {
  const { campus } = useSources();
  const [box, setBox] = useState({ w: 0, h: 0 });
  return (
    <CollapsedShell title="Map" icon="map" art={false}>
      <View
        style={styles.fill}
        onLayout={(e) =>
          setBox({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        {box.w > 0 ? (
          <CampusMap
            data={campus.data}
            width={box.w}
            height={Math.max(40, box.h - 24)}
            compact
          />
        ) : null}
        <Text style={[t.muted, { marginTop: 6 }]} numberOfLines={1}>
          Aerial view · pinch to explore
        </Text>
      </View>
    </CollapsedShell>
  );
}

export function MapExpanded() {
  const { campus } = useSources();
  const [width, setWidth] = useState(0);
  const closePan = useClosePan();
  const counts = new Map<string, number>();
  for (const b of campus.data.buildings)
    counts.set(b.kind, (counts.get(b.kind) ?? 0) + 1);
  return (
    <ExpandedShell
      title="Map"
      subtitle="Pinch to zoom, drag to move, double-tap to step in"
    >
      <View
        style={styles.mapWrap}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <CampusMap
            data={campus.data}
            width={width}
            height={Math.round(width * 0.9)}
            blocks={closePan}
          />
        ) : null}
      </View>
      <Text style={[t.muted, styles.hint]}>
        Zoom in once for entrances and every name; twice for rooms and photo
        checkpoints.
        {campus.data.photos.length === 0 ? " No photos yet." : ""}
      </Text>
      <Section title="On the map">
        {[...counts.entries()].map(([kind, n]) => (
          <Row
            key={kind}
            left={KIND_LABELS[kind as keyof typeof KIND_LABELS] ?? kind}
            right={`${n}`}
          />
        ))}
      </Section>
    </ExpandedShell>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  mapWrap: { marginTop: space.lg },
  hint: { marginTop: space.md },
});
