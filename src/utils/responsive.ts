import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Maximum effective width for scaling calculations (prevents excessive scaling on large screens)
const maxEffectiveWidth = 768;

// Device breakpoints
const BREAKPOINTS = {
    mobile: 600,
    tablet: 1024,
};

/**
 * Get the effective width for scaling calculations.
 * Caps at maxEffectiveWidth to prevent excessive scaling on large desktop screens.
 */
const getEffectiveWidth = () => {
    return Math.min(width, maxEffectiveWidth);
};

/**
 * Scales a dimension based on the device's screen width.
 * Best for images, icons, and horizontal spacing.
 * Capped at maxEffectiveWidth to prevent excessive scaling on desktop.
 */
const scale = (size: number) => {
    const effectiveWidth = getEffectiveWidth();
    return (effectiveWidth / guidelineBaseWidth) * size;
};

/**
 * Scales a dimension based on the device's screen height.
 * Best for vertical spacing.
 */
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * Scales a dimension with a factor to prevent extreme scaling on tablets.
 * Best for font sizes.
 * Uses reduced scaling factor on larger screens for better readability.
 */
const moderateScale = (size: number, factor = 0.5) => {
    // On desktop/large tablets, use even more conservative scaling for fonts
    const adjustedFactor = width > BREAKPOINTS.tablet ? factor * 0.6 : factor;
    return size + (scale(size) - size) * adjustedFactor;
};

/**
 * Helper to check if the device is a tablet.
 */
const isTablet = () => {
    // 10" tablet is roughly > 600 width in dp
    return width >= BREAKPOINTS.mobile;
};

/**
 * Helper to check if the device is a desktop.
 */
const isDesktop = () => {
    return width >= BREAKPOINTS.tablet;
};

export { height, isDesktop, isTablet, moderateScale, scale, verticalScale, width };

