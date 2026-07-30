import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { VideoView, useVideoPlayer } from "expo-video";

function youtubeEmbedUrl(videoUrl) {
  const videoId = videoUrl.split("/embed/")[1]?.split("?")[0];
  const embedded = videoUrl.replace(
    "autoplay=1",
    "autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0",
  );
  return `${embedded}&playlist=${videoId}`;
}

function fileVideoHtml(videoUrl) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;background:#000;overflow:hidden;height:100%;}video{width:100%;height:100%;object-fit:cover;}</style></head><body><video src="${videoUrl}" autoplay muted loop playsinline></video></body></html>`;
}

function Mp4Preview({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.webview}
      player={player}
      allowsFullscreen={false}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function CardVideo({
  videoUrl,
  videoType,
  fallbackVideoUrl,
  fallbackVideoType = "mp4",
}) {
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [videoUrl, videoType, fallbackVideoUrl, fallbackVideoType]);

  const activeUrl = useFallback && fallbackVideoUrl ? fallbackVideoUrl : videoUrl;
  const activeType = useFallback && fallbackVideoUrl ? fallbackVideoType : videoType;

  const switchToFallback = () => {
    if (fallbackVideoUrl && !useFallback) setUseFallback(true);
  };

  if (activeType === "mp4") {
    return (
      <View style={styles.wrap}>
        <Mp4Preview uri={activeUrl} />
      </View>
    );
  }

  const source =
    activeType === "youtube"
      ? { uri: youtubeEmbedUrl(activeUrl) }
      : { html: fileVideoHtml(activeUrl) };

  return (
    <View style={styles.wrap} pointerEvents="none">
      <WebView
        source={source}
        style={styles.webview}
        scrollEnabled={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="software"
        allowsFullscreenVideo={false}
        cacheEnabled
        onError={switchToFallback}
        onHttpError={switchToFallback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    height: 128,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  webview: { flex: 1, backgroundColor: "#000" },
});
