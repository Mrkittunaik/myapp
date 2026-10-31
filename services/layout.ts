import { useWindowDimensions } from 'react-native';
// The app is a phone layout. On tablets and in a browser it is centred in a column this wide instead of stretching across the screen.
export const MAX_APP_WIDTH = 480;
export const useAppWidth = () => Math.min(useWindowDimensions().width, MAX_APP_WIDTH);
