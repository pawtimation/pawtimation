import React from 'react';
import AuthPanel from '../components/AuthPanel';
import DocumentUploader from '../components/DocumentUploader';
import DocumentList from '../components/DocumentList';

export default function DocumentsPage() {
  return (
    <main style={{ padding: 16, display: 'grid', gap: 16 }}>
      <h1>Pawtimation Documents</h1>
      <AuthPanel />
      <h2>Add documents</h2>
      <DocumentUploader />
      <h2>Your documents</h2>
      <DocumentList />
    </main>
  );
}
