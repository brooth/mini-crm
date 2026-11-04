import _ from 'lodash';
import ContentLoader from 'react-content-loader';

import { useIsDark } from "app/app.store";
import Grid, { GridProps } from "app/components/flex/Grid";
import { useEffect, useState } from 'react';


export default function ({ items = 7, height = 100, apperanceDelay = 500, ...gridProps }: GridCardsLoaderProps) {
  const isDark = useIsDark();
  const loaderProps = isDark
    ? { backgroundColor: "#303840", foregroundColor: "#3a4550" }
    : {};
  const [opacity, setOpacity] = useState(apperanceDelay ? 0 : 1);
  useEffect(() => {
    if (apperanceDelay && opacity < 1) {
      setTimeout(() => {
        setOpacity(opacity + 0.1);
      }, apperanceDelay / 10);
    }
  }, [apperanceDelay, opacity]);
  return (
    <Grid {...gridProps}>
      {_.range(0, items).map((i) => (
        <ContentLoader key={`loaderItem${i}`} style={{ opacity, borderRadius: '6px' }} width="100%" height={height} preserveAspectRatio="none" viewBox={`0 0 100 ${height}`} {...loaderProps}>
          <rect x="0" y="0" rx="0" ry="0" width="100" height={height} />
        </ContentLoader>
      ))}
    </Grid>
  )
}

export type GridCardsLoaderProps = GridProps & {
  items?: number,
  height?: number,
  apperanceDelay?: number,
}
