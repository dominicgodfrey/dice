import { Redirect, useLocalSearchParams } from "expo-router";
import { isTileId } from "../../src/tiles/registry";

export default function ExpandedTile() {
  const { tile } = useLocalSearchParams<{ tile: string }>();
  return isTileId(tile) ? null : <Redirect href="/" />;
}
