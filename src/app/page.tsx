import React from 'react';
import { getDataset } from '@/services/teneur-repository';
import { TeneurApp } from '@/components/TeneurApp';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { dataset, storageMode } = await getDataset();
  return <TeneurApp initialDataset={dataset} initialStorageMode={storageMode} />;
}
