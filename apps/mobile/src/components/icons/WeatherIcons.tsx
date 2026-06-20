import Svg, { Circle, Line, Path } from 'react-native-svg';
import { tokens } from '../../theme/colors';
import { weatherKind } from '../../api/weather';

interface Props {
  size?: number;
  color?: string;
}

// Иконка погоды по WMO-коду (+ день/ночь для «ясно»/«малооблачно»).
export function WeatherIcon({ code, isDay = true, size = 16, color = tokens.inkDark }: Props & { code: number; isDay?: boolean }) {
  const kind = weatherKind(code);
  switch (kind) {
    case 'clear':
      return isDay ? <IconSun size={size} color={color} /> : <IconMoon size={size} color={color} />;
    case 'partly':
      return <IconPartly size={size} color={color} isDay={isDay} />;
    case 'fog':
      return <IconFog size={size} color={color} />;
    case 'rain':
      return <IconRain size={size} color={color} />;
    case 'snow':
      return <IconSnow size={size} color={color} />;
    case 'thunder':
      return <IconThunder size={size} color={color} />;
    case 'cloud':
    default:
      return <IconCloud size={size} color={color} />;
  }
}

function base(size: number, color: string) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
}

function IconSun({ size = 16, color = tokens.inkDark }: Props) {
  return (
    <Svg {...base(size, color)}>
      <Circle cx={12} cy={12} r={4} />
      <Line x1={12} y1={2} x2={12} y2={5} />
      <Line x1={12} y1={19} x2={12} y2={22} />
      <Line x1={2} y1={12} x2={5} y2={12} />
      <Line x1={19} y1={12} x2={22} y2={12} />
      <Line x1={4.9} y1={4.9} x2={7} y2={7} />
      <Line x1={17} y1={17} x2={19.1} y2={19.1} />
      <Line x1={4.9} y1={19.1} x2={7} y2={17} />
      <Line x1={17} y1={7} x2={19.1} y2={4.9} />
    </Svg>
  );
}

function IconMoon({ size = 16, color = tokens.inkDark }: Props) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8z" />
    </Svg>
  );
}

function IconCloud({ size = 16, color = tokens.inkDark }: Props) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M7 18a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6 1.07A3.5 3.5 0 0 1 17 18H7z" />
    </Svg>
  );
}

function IconPartly({ size = 16, color = tokens.inkDark, isDay = true }: Props & { isDay?: boolean }) {
  return (
    <Svg {...base(size, color)}>
      {isDay ? (
        <>
          <Circle cx={8} cy={7.5} r={3} />
          <Line x1={8} y1={1.5} x2={8} y2={3} />
          <Line x1={2} y1={7.5} x2={3.5} y2={7.5} />
          <Line x1={3.6} y1={3.1} x2={4.7} y2={4.2} />
        </>
      ) : null}
      <Path d="M9 19a3.5 3.5 0 0 1-.4-6.98 4.8 4.8 0 0 1 9.3.93A3 3 0 0 1 17.5 19H9z" />
    </Svg>
  );
}

function IconFog({ size = 16, color = tokens.inkDark }: Props) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M7 14a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6 1.07A3.5 3.5 0 0 1 17 14" />
      <Line x1={5} y1={18} x2={19} y2={18} />
      <Line x1={7} y1={21} x2={17} y2={21} />
    </Svg>
  );
}

function IconRain({ size = 16, color = tokens.inkDark }: Props) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M7 15a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6 1.07A3.5 3.5 0 0 1 17 15H7z" />
      <Line x1={8} y1={18} x2={7} y2={21} />
      <Line x1={12} y1={18} x2={11} y2={21} />
      <Line x1={16} y1={18} x2={15} y2={21} />
    </Svg>
  );
}

function IconSnow({ size = 16, color = tokens.inkDark }: Props) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M7 15a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6 1.07A3.5 3.5 0 0 1 17 15H7z" />
      <Circle cx={8} cy={19.5} r={0.8} fill={color} />
      <Circle cx={12} cy={20.5} r={0.8} fill={color} />
      <Circle cx={16} cy={19.5} r={0.8} fill={color} />
    </Svg>
  );
}

function IconThunder({ size = 16, color = tokens.inkDark }: Props) {
  return (
    <Svg {...base(size, color)}>
      <Path d="M7 14a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6 1.07A3.5 3.5 0 0 1 17 14H7z" />
      <Path d="M12 14l-2 4h3l-2 4" />
    </Svg>
  );
}
