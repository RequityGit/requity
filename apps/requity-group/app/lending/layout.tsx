import { RetellWidget } from '../components/RetellWidget';

export default function LendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <RetellWidget />
    </>
  );
}
