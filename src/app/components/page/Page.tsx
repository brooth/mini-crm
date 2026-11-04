import PageContent from 'app/components/page/Content';
import PageHeader, { PageHeaderProps } from 'app/components/page/Header';
import React from "react";


export default function Page({
  hidden, children, ...headerProps
}: PageProps) {
  if (hidden) return null;

  return (
    <>
      <PageHeader {...headerProps} />
      <PageContent>
        {children}
      </PageContent>
    </>
  );
}

export type PageProps = PageHeaderProps & {
  hidden?: boolean,
  children?: React.ReactNode,
}
