import ScannerPage from '../page';

export default async function ScannerRoute({ params }) {
  const resolved = await params;
  const raw = resolved?.scan || '';
  const scanName = decodeURIComponent(raw).replace(/[-_]+/g, ' ');
  return <ScannerPage scanName={scanName} />;
}
