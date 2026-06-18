'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from './page.module.css';
import { Search, Plus, Upload, Folder, FileText, Image, File, Download, Trash2, Eye, X, Calendar, User } from 'lucide-react';
import documentService from '../../../services/documentService';
import { getAccessToken } from '../../../services/api';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import SearchBar from '../../../components/ui/SearchBar';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('internal');
  const [uploadVisibility, setUploadVisibility] = useState('internal');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentService.getDocuments();
      if (res.success) {
        setDocuments(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: 'All Documents' },
    { key: 'customer', label: 'Customer Files' },
    { key: 'quote', label: 'Quote Attachments' },
    { key: 'ticket', label: 'Ticket Files' },
    { key: 'internal', label: 'Internal Documents' }
  ];

  const getFileIcon = (mime) => {
    if (mime.includes('pdf')) return <FileText size={20} className={styles.iconPdf} />;
    if (mime.includes('image')) return <Image size={20} className={styles.iconImage} />;
    return <File size={20} className={styles.iconFile} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.original_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || d.category === activeCategory;
    
    let matchesDate = true;
    if (activeDateFilter !== 'all') {
      const docDate = new Date(d.createdAt || d.created_at || Date.now());
      const now = new Date();
      const diffDays = Math.floor((now - docDate) / (1000 * 60 * 60 * 24));
      
      if (activeDateFilter === 'today') matchesDate = diffDays <= 1;
      else if (activeDateFilter === 'week') matchesDate = diffDays <= 7;
      else if (activeDateFilter === 'month') matchesDate = diffDays <= 30;
      else if (activeDateFilter === 'year') matchesDate = diffDays <= 365;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const handleDeleteDoc = async (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        const res = await documentService.deleteDocument(id);
        if (res.success) {
          setDocuments(prev => prev.filter(d => d.id !== id));
        }
      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document');
      }
    }
  };

  const handleDownload = (id) => {
    const url = documentService.getDownloadUrl(id);
    const token = typeof window !== 'undefined' ? getAccessToken() : null;
    
    
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Download failed');
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'document';
      return response.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    })
    .catch(error => {
      console.error('Download error:', error);
      alert('Failed to download document');
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);
    formData.append('visibility', uploadVisibility);
    formData.append('related_type', 'general');

    try {
      const res = await documentService.uploadDocument(formData);
      if (res.success) {
        setDocuments([res.data, ...documents]);
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setUploadCategory('internal');
        setUploadVisibility('internal');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Documents</h1>
        </div>
        <Button variant="primary" icon={Upload} onClick={() => setIsUploadModalOpen(true)}>
          Upload Document
        </Button>
      </div>

      
      <div className={styles.filtersBar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search documents by filename..."
          label=""
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={styles.filterGroup} style={{ flex: 'none' }}>
            <select 
              className={styles.filterSelect}
              value={activeCategory} 
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup} style={{ flex: 'none' }}>
            <select 
              className={styles.filterSelect}
              value={activeDateFilter} 
              onChange={(e) => setActiveDateFilter(e.target.value)}
            >
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="year">Past Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.docsTable}>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Linked To</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th className={styles.actionsCol}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>Loading documents...</td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyState}>
                    No documents found. Click "Upload Document" to add files.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div className={styles.fileNameCell}>
                        <span className={styles.primaryText}>{doc.original_name || doc.file_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.linkedBadge}>
                        {doc.related_type === 'general' ? 'General' : doc.linked_name || doc.related_id || 'Internal'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.sizeText}>{formatFileSize(doc.size)}</span>
                    </td>
                    <td>
                      <div className={styles.uploaderCell}>
                        <span>{doc.uploader ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || 'Unknown' : doc.uploaded_by}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <span>{new Date(doc.createdAt || doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className={styles.actionsCol}>
                      <div className={styles.rowActions}>
                        <button className={`${styles.actionBtn} ${styles.downloadBtn}`} title="Download" onClick={() => handleDownload(doc.id)}><Download size={14} /></button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={() => handleDeleteDoc(doc.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Upload} onClick={handleUploadSubmit} disabled={!selectedFile} isLoading={isUploading}>Upload</Button>
          </>
        }
      >
        <div className={styles.modalForm}>
          <div className={styles.dropZone}>
            <Upload size={36} />
            <p>{selectedFile ? selectedFile.name : "Drag & drop files here, or click to browse"}</p>
            <span>Supports PDF, DOCX, PNG, JPG up to 10 MB</span>
            <input type="file" className={styles.fileInput} onChange={handleFileChange} />
          </div>

          <div className={styles.formRow}>
            <FormField 
              label="Category" type="select" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}
              options={[
                { value: 'internal', label: 'Internal Document' },
                { value: 'customer', label: 'Customer File' },
                { value: 'quote', label: 'Quote Attachment' },
                { value: 'ticket', label: 'Ticket Attachment' }
              ]}
            />
            <FormField 
              label="Visibility" type="select" value={uploadVisibility} onChange={(e) => setUploadVisibility(e.target.value)}
              options={[
                { value: 'internal', label: 'Internal Only' },
                { value: 'public', label: 'Shared with Customer' }
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
