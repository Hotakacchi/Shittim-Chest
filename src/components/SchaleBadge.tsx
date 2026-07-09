import { Image, StyleSheet } from 'react-native';

const schaleMark = require('../../assets/boot/schale-mark.png');

export function SchaleBadge() {
  return <Image source={schaleMark} style={styles.mark} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  mark: {
    width: 40,
    height: 59,
  },
});
