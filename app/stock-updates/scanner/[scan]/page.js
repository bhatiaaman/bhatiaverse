import ScannerPage from '../page';

export default async function ScannerRoute({ params }) {
  const resolved = await params;
  const raw = resolved?.scan || '';
  const scanName = decodeURIComponent(raw).replace(/[-_]+/g, ' ');
  // Pass raw slug separately so ScannerPage uses it for Redis lookup
  // without the display-name round-trip corrupting it
  return <ScannerPage scanName={scanName} scanSlug={raw} />;
}