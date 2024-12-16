
import { Devvit } from '@devvit/public-api';
import Settings from '../settings.json' assert { type: "json" };
import { PixelSymbol, SupportedGlyphs } from './PixelSymbol.js';
import { PixelText } from './PixelText.js';


const styles = {
  primary: {
    backgroundColor: Settings.theme.primary,
    borderColor: Settings.theme.primary,
    color: 'white',
  },
  secondary: {
    backgroundColor: "white",
    borderColor: Settings.theme.primary,
    color: Settings.theme.primary,
  },
};


interface StyledButtonProps {
  onPress?: () => void | Promise<void>;
  label?: string;
  leadingIcon?: SupportedGlyphs;
  trailingIcon?: SupportedGlyphs;
  scale?: number;
  appearance?: 'primary' | 'secondary';
  width?: Devvit.Blocks.SizeString;
  height?: Devvit.Blocks.SizeString;
}

export const StyledButton = (props: StyledButtonProps): JSX.Element => {
  const {
    onPress,
    label,
    width = '100%',
    height = '45px',
    scale = 2,
    appearance,
    leadingIcon,
    trailingIcon,
  } = props;
  const style = styles[appearance || 'primary'];
  return (
    <hstack
      height={height}
      width={width}
      onPress={onPress}
      backgroundColor={style.borderColor}
      cornerRadius='small'
      padding="xsmall"
    >
      <hstack height="100%"
        width="100%"
        gap="small"
        cornerRadius='small'
        alignment="middle center"
        backgroundColor={style.backgroundColor}
      >
        {leadingIcon ? <PixelSymbol scale={2} type={leadingIcon} color={style.color} /> : null}
        {label ? <PixelText scale={scale} color={style.color}>{label}</PixelText> : null}
        {trailingIcon ? <PixelSymbol scale={2} type={trailingIcon} color={style.color} /> : null}
      </hstack>
    </hstack>

  );
};
