import { View } from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import {
  VIEWBOX,
  ANIMAL_COLOR,
  SELECTED_FILL,
  FOOD_EXCLUDED_FILL,
  FOOD_EXCLUDED_STROKE,
  getRegionGeometry,
  REGION_DOTS,
  REGION_DOT_W,
  REGION_LABELS,
  BodyShape,
} from "./AnimalBodyMap";

// Sifariş qəbzi/detayı üçün bədən xəritəsi — AnimalBodyMap-dakı stok/filtr
// məntiqi yoxdur, sadəcə bu sifarişdə ALINMIŞ (purchasedPartKeys) bölgələr
// parlaq qırmızı, qalanları solğun görünür. Web-dəki components/meat/OrderAnimalMap.js
// portu (bax orada da activePartKeys/onSelectPart heç vaxt istifadə olunmur).
export default function OrderAnimalMap({
  animalKey,
  purchasedPartKeys,
  showLabels = false,
  style,
}) {
  const geometry = getRegionGeometry(animalKey);
  const dotsD = REGION_DOTS[animalKey];
  const labelLayout = showLabels ? REGION_LABELS[animalKey] : null;

  return (
    <View style={style} collapsable={false}>
      <Svg viewBox={VIEWBOX} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <BodyShape animalKey={animalKey} color={ANIMAL_COLOR} />

        {Object.entries(geometry).map(([partKey, d]) => {
          const purchased = purchasedPartKeys.has(partKey);
          return (
            <Path
              key={partKey}
              d={d}
              fill={purchased ? SELECTED_FILL : FOOD_EXCLUDED_FILL}
              fillOpacity={purchased ? 1 : 0.7}
              stroke={purchased ? SELECTED_FILL : dotsD ? "none" : FOOD_EXCLUDED_STROKE}
              strokeWidth={purchased ? 4 : dotsD ? 0 : 1.5}
              strokeLinejoin="round"
            />
          );
        })}

        {dotsD && (
          <Path
            d={dotsD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={REGION_DOT_W[animalKey]}
            strokeLinecap="round"
          />
        )}

        {labelLayout &&
          labelLayout.map((L, i) => (
            <SvgText
              key={`lbl-${i}`}
              x={L.x}
              y={L.y - 1.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={L.s}
              fontWeight="800"
              fill="#FFFFFF"
            >
              {L.t}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}
