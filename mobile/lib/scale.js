import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FONT_SCALE = PixelRatio.getFontScale();

// Reference device the screens are tuned against (dp size + OS font-scale setting).
const BASE_WIDTH = 411;
const BASE_HEIGHT = 937;
const BASE_FONT_SCALE = 0.85;

export function scale(size) {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}

export function verticalScale(size) {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

// Dampened scale so sizes don't swing as wildly as the raw width ratio on
// very small/large or tablet-ish screens.
export function moderateScale(size, factor = 0.5) {
  return size + (scale(size) - size) * factor;
}

// React Native auto-multiplies fontSize by the device's OS font-size setting
// (PixelRatio.getFontScale()). That means identical style values render at
// different physical sizes across phones depending on the user's accessibility
// text-size preference, on top of screen-size differences. This cancels that
// out (relative to the reference device's font scale) so text reads the same
// size everywhere regardless of the phone's font-size setting.
export function scaleFont(size, factor = 0.5) {
  return (moderateScale(size, factor) * (BASE_FONT_SCALE / FONT_SCALE));
}
