import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { VideoView, useVideoPlayer } from "expo-video";
import { scale } from "../lib/scale";

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

function youtubeVideoId(videoUrl) {
  return videoUrl.split("/embed/")[1]?.split("?")[0];
}

function youtubeIframeHtml(videoUrl) {
  const videoId = youtubeVideoId(videoUrl);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;background:#000;overflow:hidden;height:100%;}#player{position:absolute;top:50%;left:50%;width:180%;height:180%;border:0;transform:translate(-50%,-50%);}#mask{position:absolute;inset:0;background:#000;opacity:1;transition:opacity 0.25s ease;pointer-events:none;z-index:5;}</style></head><body>
<div id="player"></div>
<div id="mask"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
  var player;
  var mask = document.getElementById('mask');
  function showMask() { mask.style.opacity = '1'; }
  function hideMask() { mask.style.opacity = '0'; }
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      videoId: '${videoId}',
      playerVars: {
        autoplay: 1, mute: 1, controls: 0, modestbranding: 1, playsinline: 1,
        rel: 0, showinfo: 0, disablekb: 1, iv_load_policy: 3, fs: 0
      },
      events: {
        onReady: function (e) {
          e.target.mute();
          e.target.playVideo();
          setTimeout(function () {
            var s = player.getPlayerState();
            if (s !== YT.PlayerState.PLAYING && s !== YT.PlayerState.BUFFERING) {
              window.ReactNativeWebView.postMessage('error');
            }
          }, 3000);
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) {
            showMask();
            player.seekTo(0);
            player.playVideo();
          } else if (e.data === YT.PlayerState.PLAYING) {
            setTimeout(hideMask, 120);
          } else if (e.data === YT.PlayerState.BUFFERING) {
            showMask();
          }
        },
        onError: function () { window.ReactNativeWebView.postMessage('error'); }
      }
    });
  }
</script>
</body></html>`;
}

function fileVideoHtml(videoUrl) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;background:#000;overflow:hidden;height:100%;}video{width:100%;height:100%;object-fit:cover;}</style></head><body><video src="${videoUrl}" autoplay muted loop playsinline onerror="window.ReactNativeWebView.postMessage('error')"></video></body></html>`;
}

function Mp4Preview({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      allowsFullscreen={false}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function CardVideo({
  videoUrl,
  videoType = "mp4",
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
      ? { html: youtubeIframeHtml(activeUrl), baseUrl: "https://qurbanet.az/" }
      : { html: fileVideoHtml(activeUrl) };

  return (
    <View style={styles.wrap} pointerEvents="none">
      <WebView
        source={source}
        style={styles.video}
        scrollEnabled={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        originWhitelist={["*"]}
        userAgent={MOBILE_USER_AGENT}
        androidLayerType="hardware"
        allowsFullscreenVideo={false}
        cacheEnabled
        onError={switchToFallback}
        onHttpError={switchToFallback}
        onMessage={switchToFallback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: scale(138),
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: { flex: 1, backgroundColor: "#000" },
});
