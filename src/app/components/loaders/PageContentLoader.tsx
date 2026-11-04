import _ from "lodash";

import { useEffect, useState } from "react";
import ContentLoader from "react-content-loader";

import { useIsDark } from "app/app.store";
import Grid, { GridProps } from "app/components/flex/Grid";
import { useClassNames } from "utils";

import "./PageContentLoader.css";


export default function ({
  className, forms = 2, apperanceDelay = 500, gap = 20, ...gridProps
}: PageContentLoaderProps) {
  const classNames = useClassNames("app-loaders-page-content-loader", className);
  const isDark = useIsDark();
  const loaderProps = isDark
    ? { backgroundColor: "#303840", foregroundColor: "#3a4550" }
    : {};

  // opacity
  const [opacity, setOpacity] = useState(apperanceDelay ? 0 : 1);
  useEffect(() => {
    if (apperanceDelay && opacity < 1) {
      setTimeout(() => {
        setOpacity(opacity + 0.1);
      }, apperanceDelay / 10);
    }
  }, [apperanceDelay, opacity]);

  return (
    <div className={classNames}>
      <ContentLoader style={{ opacity }} viewBox="0 0 100 3" {...loaderProps}>
        <rect x="0" y="0" rx="1" ry="3" width="50" height="3" />
      </ContentLoader>
      <Grid gap={gap} {...gridProps}>
        {_.range(0, forms).map(() => (
          <ContentLoader style={{ opacity }} viewBox="0 0 100 110" {...loaderProps}>
            <rect x="0" y="0" rx="1" ry="2" width="40" height="5" />
            <rect x="0" y="8" rx="2" ry="2" width="100" height="20" />
            <rect x="0" y="30" rx="2" ry="2" width="100" height="80" />
          </ContentLoader>
        ))}
      </Grid>
    </div>
  )
}

export type PageContentLoaderProps = GridProps & {
  forms?: number,
  apperanceDelay?: number,
}
