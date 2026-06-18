import documentService from '../services/documentService';

export const downloadAndSaveExport = async (content, filename) => {
  try {
    const blob = typeof content === 'string' 
      ? new Blob([content], { type: 'text/csv' }) 
      : content;

    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
    }, 100);

    
    const file = new File([blob], filename, { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'general'); 
    formData.append('visibility', 'internal'); 
    
    await documentService.uploadDocument(formData);
    console.log(`[Auto-Sync] Saved ${filename} to Documents repository.`);
  } catch (error) {
    console.error('[Auto-Sync] Failed to save export to documents:', error);
  }
};
