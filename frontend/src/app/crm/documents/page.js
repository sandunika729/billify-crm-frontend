'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from './page.module.css';
import { Search, Plus, Upload, Folder, FileText, Image, File, Download, Trash2, Eye, X, Calendar, User, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import documentService from '../../../services/documentService';

import Button from '../../../components/ui/Button';
import Modal from '../../../components/modals/Modal';
import FormField from '../../../components/forms/FormField';
import SearchBar from '../../../components/ui/SearchBar';
import ColumnManager from '../../../components/ui/ColumnManager';
import ContextMenu from '../../../components/ui/ContextMenu';
import { alert, confirm } from '@/utils/alertService';

export default function DocumentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('none');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [visibleColumns, setVisibleColumns] = useState(['name', 'linked_to', 'size', 'uploaded_by', 'date']);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('internal');
  const [uploadVisibility, setUploadVisibility] = useState('internal');
  const [isUploading, setIsUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const handleColumnToggle = (colId) => {
    setVisibleColumns(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleContextMenu = (e, doc) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, record: doc });
  };

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

  const toggleGroup = (key) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getGroupKey = (doc) => {
    if (groupBy === 'category') {
      const labels = { customer: 'Customer Files', quote: 'Quote Attachments', ticket: 'Ticket Files', internal: 'Internal Documents' };
      return labels[doc.category] || doc.category || 'Uncategorised';
    }
    if (groupBy === 'type') {
      const m = doc.mime_type || doc.mimetype || '';
      if (m.includes('pdf')) return 'PDF Documents';
      if (m.includes('image')) return 'Images';
      if (m.includes('word') || m.includes('document')) return 'Word Documents';
      if (m.includes('sheet') || m.includes('excel')) return 'Spreadsheets';
      return 'Other Files';
    }
    if (groupBy === 'uploader') {
      return doc.uploader
        ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || 'Unknown'
        : 'Unknown';
    }
    if (groupBy === 'date') {
      const d = new Date(doc.createdAt || doc.created_at);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    return null;
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

  const groupedDocs = (() => {
    if (groupBy === 'none') return null;
    const map = {};
    filteredDocs.forEach(doc => {
      const key = getGroupKey(doc);
      if (!map[key]) map[key] = [];
      map[key].push(doc);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  })();

  const handleDeleteDoc = async (id) => {
    if (await confirm('Are you sure you want to delete this document?')) {
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

  const handleViewDocument = async (id, mimeType) => {
    try {
      const response = await documentService.downloadDocument(id);
      const mime = mimeType || response.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('View error:', error);
      alert('Failed to open document. The file may no longer exist on the server.');
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      const response = await documentService.downloadDocument(id);
      const blob = new Blob([response.data]);
      const contentDisposition = response.headers?.['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || originalName || 'document'
        : originalName || 'document';
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. The file may no longer exist on the server.');
    }
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

          <div className={styles.filterGroup} style={{ flex: 'none' }}>
            <div className={styles.groupByWrapper}>
              <Layers size={12} className={styles.groupByIcon} />
              <select
                className={styles.filterSelect}
                value={groupBy}
                onChange={(e) => { setGroupBy(e.target.value); setCollapsedGroups({}); }}
                style={{ paddingLeft: '1.6rem' }}
              >
                <option value="none">No Grouping</option>
                <option value="category">Group by Category</option>
                <option value="type">Group by File Type</option>
                <option value="uploader">Group by Uploader</option>
                <option value="date">Group by Month</option>
              </select>
            </div>
          </div>
          <ColumnManager 
            columns={[
              { id: 'name', label: 'File Name', required: true },
              { id: 'linked_to', label: 'Linked To', required: false },
              { id: 'size', label: 'Size', required: false },
              { id: 'uploaded_by', label: 'Uploaded By', required: false },
              { id: 'date', label: 'Date', required: false }
            ]}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.docsTable}>
            <thead>
              <tr>
                {visibleColumns.includes('name') && <th>File Name</th>}
                {visibleColumns.includes('linked_to') && <th>Linked To</th>}
                {visibleColumns.includes('size') && <th>Size</th>}
                {visibleColumns.includes('uploaded_by') && <th>Uploaded By</th>}
                {visibleColumns.includes('date') && <th>Date</th>}
                <th className={styles.actionsCol}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className={styles.emptyState}>Loading documents...</td></tr>
              ) : filteredDocs.length === 0 ? (
                <tr><td colSpan="6" className={styles.emptyState}>No documents found. Click "Upload Document" to add files.</td></tr>
              ) : groupedDocs ? (
                
                groupedDocs.map(([groupLabel, docs]) => (
                  <React.Fragment key={groupLabel}>
                    <tr
                      className={styles.groupHeaderRow}
                      onClick={() => toggleGroup(groupLabel)}
                    >
                      <td colSpan={visibleColumns.length + 1} className={styles.groupHeaderCell}>
                        <span className={styles.groupChevron}>
                          {collapsedGroups[groupLabel]
                            ? <ChevronRight size={12} />
                            : <ChevronDown size={12} />}
                        </span>
                        <span className={styles.groupLabel}>{groupLabel}</span>
                        <span className={styles.groupCount}>{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
                      </td>
                    </tr>
                    {!collapsedGroups[groupLabel] && docs.map(doc => (
                      <tr 
                        key={doc.id}
                        onContextMenu={(e) => handleContextMenu(e, doc)}
                        style={doc.flag_status === 'flagged' ? { backgroundColor: 'var(--color-bg-hover, #f1f5f9)' } : {}}
                      >
                        {visibleColumns.includes('name') && (
                          <td>
                            <div className={styles.fileNameCell}>
                              <span className={styles.primaryText}>{doc.original_name || doc.file_name}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('linked_to') && (
                          <td>
                            <span className={styles.linkedBadge}>
                              {doc.related_type === 'general' ? 'General' : doc.linked_name || doc.related_id || 'Internal'}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('size') && (
                          <td><span className={styles.sizeText}>{formatFileSize(doc.size)}</span></td>
                        )}
                        {visibleColumns.includes('uploaded_by') && (
                          <td>
                            <div className={styles.uploaderCell}>
                              <span>{doc.uploader ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || 'Unknown' : doc.uploaded_by}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('date') && (
                          <td>
                            <div className={styles.dateCell}>
                              <span>{new Date(doc.createdAt || doc.created_at).toLocaleDateString()}</span>
                            </div>
                          </td>
                        )}
                        <td className={styles.actionsCol}>
                          <div className={styles.rowActions}>
                            <button className={`${styles.actionBtn} ${styles.viewBtn}`} title="View" onClick={() => handleViewDocument(doc.id, doc.mime_type || doc.mimetype)}><Eye size={12} /></button>
                            <button className={`${styles.actionBtn} ${styles.downloadBtn}`} title="Download" onClick={() => handleDownload(doc.id, doc.original_name)}><Download size={12} /></button>
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={() => handleDeleteDoc(doc.id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                
                filteredDocs.map(doc => (
                  <tr 
                    key={doc.id}
                    onContextMenu={(e) => handleContextMenu(e, doc)}
                    style={doc.flag_status === 'flagged' ? { backgroundColor: 'var(--color-bg-hover, #f1f5f9)' } : {}}
                  >
                    {visibleColumns.includes('name') && (
                      <td>
                        <div className={styles.fileNameCell}>
                          <span className={styles.primaryText}>{doc.original_name || doc.file_name}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('linked_to') && (
                      <td>
                        <span className={styles.linkedBadge}>
                          {doc.related_type === 'general' ? 'General' : doc.linked_name || doc.related_id || 'Internal'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('size') && (
                      <td><span className={styles.sizeText}>{formatFileSize(doc.size)}</span></td>
                    )}
                    {visibleColumns.includes('uploaded_by') && (
                      <td>
                        <div className={styles.uploaderCell}>
                          <span>{doc.uploader ? `${doc.uploader.first_name || ''} ${doc.uploader.last_name || ''}`.trim() || 'Unknown' : doc.uploaded_by}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('date') && (
                      <td>
                        <div className={styles.dateCell}>
                          <span>{new Date(doc.createdAt || doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                    )}
                    <td className={styles.actionsCol}>
                      <div className={styles.rowActions}>
                        <button className={`${styles.actionBtn} ${styles.viewBtn}`} title="View" onClick={() => handleViewDocument(doc.id, doc.mime_type || doc.mimetype)}><Eye size={12} /></button>
                        <button className={`${styles.actionBtn} ${styles.downloadBtn}`} title="Download" onClick={() => handleDownload(doc.id, doc.original_name)}><Download size={12} /></button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete" onClick={() => handleDeleteDoc(doc.id)}><Trash2 size={12} /></button>
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
            <Button variant="primary" onClick={handleUploadSubmit} disabled={!selectedFile} isLoading={isUploading}>Upload</Button>
          </>
        }
      >
        <div className={styles.modalForm}>
          <div className={styles.dropZone}>
            <Upload size={26} />
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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: 'View Document', icon: Eye, onClick: () => handleViewDocument(contextMenu.record.id, contextMenu.record.mime_type || contextMenu.record.mimetype) },
            { label: 'Download', icon: Download, onClick: () => handleDownload(contextMenu.record.id, contextMenu.record.original_name) },
            { label: 'Delete', icon: Trash2, onClick: () => handleDeleteDoc(contextMenu.record.id), variant: 'danger' }
          ]}
        />
      )}
    </div>
  );
}
