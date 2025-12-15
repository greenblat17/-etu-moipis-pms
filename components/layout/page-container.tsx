import { Header } from "./header";

interface PageContainerProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  description,
  actions,
  children,
}: PageContainerProps) {
  return (
    <>
      <Header title={title} description={description} actions={actions} />
      <main className="flex-1 p-6">{children}</main>
    </>
  );
}

