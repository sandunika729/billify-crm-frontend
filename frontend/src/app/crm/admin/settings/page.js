'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, X, Plus, Trash2, CheckCircle, ImageIcon,
  Copy, RefreshCw, AlertTriangle, Code2
} from 'lucide-react';
import styles from './page.module.css';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/modals/Modal';
import FormField from '../../../../components/forms/FormField';
import shopProfileService from '../../../../services/shopProfileService';
import customFieldService from '../../../../services/customFieldService';

const CF_TABS = [
  { key: 'customer', label: 'Customers' },
  { key: 'lead', label: 'Leads' },
  { key: 'deal', label: 'Deals' },
];

const PREDEFINED_FIELDS = {
  customer: [
    { field_name: 'vat_number', field_label: 'VAT Number', field_type: 'text' },
    { field_name: 'industry', field_label: 'Industry', field_type: 'text' },
    { field_name: 'website', field_label: 'Website URL', field_type: 'text' },
    { field_name: 'facebook_url', field_label: 'Facebook Profile', field_type: 'text' }
  ],
  lead: [
    { field_name: 'lead_source', field_label: 'Lead Source', field_type: 'select', options: ['Website', 'Referral', 'Social Media', 'Cold Call'] },
    { field_name: 'budget', field_label: 'Budget', field_type: 'number' },
    { field_name: 'job_title', field_label: 'Job Title', field_type: 'text' },
    { field_name: 'timeframe', field_label: 'Timeframe', field_type: 'select', options: ['Immediately', '1-3 Months', '3-6 Months', '6+ Months'] }
  ],
  deal: [
    { field_name: 'competitors', field_label: 'Competitors', field_type: 'text' },
    { field_name: 'loss_reason', field_label: 'Loss Reason', field_type: 'select', options: ['Price', 'Competitor', 'Timing', 'Features'] },
    { field_name: 'contract_length', field_label: 'Contract Length (Months)', field_type: 'number' }
  ]
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function buildSnippet(apiKey) {
  return `<!-- Billify CRM Support Widget -->
<!-- Paste this anywhere in your website's HTML -->
<div id="crm-support-widget"></div>

<style>
  #crm-support-widget form {
    display: flex; flex-direction: column; gap: 12px;
    max-width: 480px; font-family: sans-serif;
  }
  #crm-support-widget input,
  #crm-support-widget textarea {
    padding: 10px 14px; border: 1px solid #d1d5db;
    border-radius: 6px; font-size: 14px; width: 100%; box-sizing: border-box;
  }
  #crm-support-widget button {
    padding: 10px 20px; background: #8b5cf6; color: #fff;
    border: none; border-radius: 6px; font-size: 14px;
    cursor: pointer; font-weight: 600;
  }
  #crm-support-widget button:hover { background: #7c3aed; }
  #crm-support-widget .crm-success {
    padding: 12px 16px; background: #d1fae5; border-radius: 6px;
    color: #065f46; font-size: 14px; display: none;
  }
  #crm-support-widget .crm-error {
    padding: 12px 16px; background: #fee2e2; border-radius: 6px;
    color: #991b1b; font-size: 14px; display: none;
  }
</style>

<script>
(function() {
  var widget = document.getElementById('crm-support-widget');
  widget.innerHTML = \`
    <h3 style="margin:0 0 16px;font-size:18px;">Submit a Support Ticket</h3>
    <form id="crm-ticket-form">
      <input name="name" placeholder="Your Name *" required />
      <input name="email" type="email" placeholder="Email Address *" required />
      <input name="phone" placeholder="Phone Number (optional)" />
      <input name="subject" placeholder="Subject *" required />
      <textarea name="message" rows="5" placeholder="Describe your issue *" required></textarea>
      <button type="submit">Submit Ticket</button>
    </form>
    <div class="crm-success" id="crm-success-msg"></div>
    <div class="crm-error" id="crm-error-msg"></div>
  \`;

  document.getElementById('crm-ticket-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = this.querySelector('button');
    btn.disabled = true; btn.textContent = 'Submitting...';
    var data = Object.fromEntries(new FormData(this).entries());
    try {
      var res = await fetch('${API_BASE}/public/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': '${apiKey}' },
        body: JSON.stringify(data)
      });
      var json = await res.json();
      if (res.ok && json.success) {
        document.getElementById('crm-ticket-form').style.display = 'none';
        var s = document.getElementById('crm-success-msg');
        s.style.display = 'block';
        s.textContent = '✓ Ticket submitted! Your reference: ' + json.data.ticket_no;
      } else {
        var err = document.getElementById('crm-error-msg');
        err.style.display = 'block';
        err.textContent = json.message || 'Something went wrong. Please try again.';
        btn.disabled = false; btn.textContent = 'Submit Ticket';
      }
    } catch(ex) {
      var err = document.getElementById('crm-error-msg');
      err.style.display = 'block';
      err.textContent = 'Network error. Please try again.';
      btn.disabled = false; btn.textContent = 'Submit Ticket';
    }
  });
})();
</script>
<!-- End Billify CRM Support Widget -->`;
}

export default function SettingsPage() {
  const [mainTab, setMainTab] = useState('shop');

  
  const [profile, setProfile] = useState({ shop_name: '', email: '', phone: '', address: '', logo_base64: '' });
  const [apiKey, setApiKey] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const logoInputRef = useRef(null);

  
  const [keyCopied, setKeyCopied] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  
  const [cfTab, setCfTab] = useState('customer');
  const [cfFields, setCfFields] = useState([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [isCfModalOpen, setIsCfModalOpen] = useState(false);
  const [cfForm, setCfForm] = useState({ field_name: '', field_label: '', field_type: 'text', options: '', is_required: false });

  useEffect(() => {
    if (mainTab === 'shop' || mainTab === 'widget') {
      fetchProfile();
    } else if (mainTab === 'customfields') {
      fetchCfFields();
    }
  }, [mainTab, cfTab]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await shopProfileService.getProfile();
      if (res && res.success && res.data) {
        setProfile({
          shop_name: res.data.shop_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          logo_base64: res.data.logo_base64 || '',
        });
        setApiKey(res.data.public_api_key || '');
      }
    } catch (e) {
      console.error('Failed to load shop profile:', e);
      setProfileError('Failed to load shop profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileError('Logo must be smaller than 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setProfile(prev => ({ ...prev, logo_base64: ev.target.result })); setProfileError(''); };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => { setProfile(prev => ({ ...prev, logo_base64: '' })); if (logoInputRef.current) logoInputRef.current.value = ''; };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!profile.shop_name.trim()) { setProfileError('Shop name is required.'); return; }
    setProfileSaving(true);
    try {
      const res = await shopProfileService.upsertProfile(profile);
      if (res.success) {
        if (res.data?.public_api_key) setApiKey(res.data.public_api_key);
        setProfileSuccess('✓ Shop profile saved successfully!');
        setTimeout(() => setProfileSuccess(''), 3500);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to save shop profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(buildSnippet(apiKey));
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  const handleRegenKey = async () => {
    if (!confirm('Regenerate the API key? Your current website widget will stop working until you paste the new key.')) return;
    setRegenLoading(true);
    try {
      const res = await shopProfileService.regenerateKey();
      if (res.success) { setApiKey(res.data.public_api_key); }
    } catch (err) {
      alert('Failed to regenerate key.');
    } finally {
      setRegenLoading(false);
    }
  };

  const fetchCfFields = async () => {
    setCfLoading(true);
    try {
      const res = await customFieldService.getFields(cfTab);
      if (res.success) setCfFields(res.data);
    } catch (err) {
      console.error('Failed to load custom fields:', err);
    } finally {
      setCfLoading(false);
    }
  };

  const handleSaveCfField = async (e) => {
    e.preventDefault();
    try {
      const optionsArray = cfForm.field_type === 'select' && cfForm.options ? cfForm.options.split(',').map(s => s.trim()).filter(Boolean) : [];
      await customFieldService.createField({
        entity_type: cfTab,
        field_name: cfForm.field_name || cfForm.field_label.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        field_label: cfForm.field_label,
        field_type: cfForm.field_type,
        options: optionsArray,
        is_required: cfForm.is_required,
      });
      setIsCfModalOpen(false);
      setCfForm({ field_name: '', field_label: '', field_type: 'text', options: '', is_required: false });
      fetchCfFields();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving field');
    }
  };

  const handleDeleteCfField = async (id) => {
    if (!confirm('Delete this custom field? Existing data in records will not be removed, but the field will no longer appear in forms.')) return;
    try {
      await customFieldService.deleteField(id);
      fetchCfFields();
    } catch {
      alert('Error deleting field');
    }
  };

  const handleTogglePredefinedField = async (predefField, isChecked) => {
    try {
      if (isChecked) {
        await customFieldService.createField({
          entity_type: cfTab,
          field_name: predefField.field_name,
          field_label: predefField.field_label,
          field_type: predefField.field_type,
          options: predefField.options || [],
          is_required: false,
        });
      } else {
        const existingField = cfFields.find(f => f.field_name === predefField.field_name);
        if (existingField) {
          await customFieldService.deleteField(existingField.id);
        }
      }
      fetchCfFields();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling field');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div><h1>Settings</h1></div>
      </div>

      <div className={styles.settingsLayout}>
        {}
        <div className={styles.navPanel}>
          <div className={styles.panelHeader}><h3>Configuration</h3></div>
          <div className={styles.navList}>
            {[
              { key: 'shop', label: 'Shop Profile' },
              { key: 'widget', label: 'Website Widget' },
              { key: 'customfields', label: 'Custom Fields' },
            ].map(item => (
              <button
                key={item.key}
                className={`${styles.navItem} ${mainTab === item.key ? styles.navItemActive : ''}`}
                onClick={() => setMainTab(item.key)}
              >
                <div className={styles.navItemInfo}>
                  <div className={styles.navItemLabel}>{item.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {}
        <div className={styles.contentPanel}>

          {}
          {mainTab === 'shop' && (
            <>
              <div className={styles.contentHeader}>
                <div><h2 className={styles.contentTitle}>Shop Profile</h2></div>
              </div>
              <div className={styles.contentBody}>
                {profileLoading ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Loading profile...</p>
                ) : (
                  <form onSubmit={handleSaveProfile}>
                    <div className={styles.profileLayout}>
                      <div className={styles.logoSection}>
                        <span className={styles.logoLabel}>Shop Logo</span>
                        <div className={styles.logoPreviewBox} onClick={() => logoInputRef.current?.click()} title="Click to upload logo">
                          {profile.logo_base64 ? (
                            <img src={profile.logo_base64} alt="Shop Logo Preview" />
                          ) : (
                            <div className={styles.logoPlaceholder}>
                              <ImageIcon size={28} style={{ opacity: 0.35 }} />
                              <span>Click to upload</span>
                            </div>
                          )}
                        </div>
                        <p className={styles.logoHint}>PNG, JPG or SVG · Max 2MB<br />Displayed on Quote PDFs</p>
                        <div className={styles.logoActions}>
                          <button type="button" className={styles.logoUploadBtn} onClick={() => logoInputRef.current?.click()}>
                            <Upload size={12} /> Upload
                          </button>
                          {profile.logo_base64 && (
                            <button type="button" className={styles.logoRemoveBtn} onClick={handleRemoveLogo}>
                              <X size={12} /> Remove
                            </button>
                          )}
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                      </div>

                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Shop Name *</label>
                          <input className={styles.formInput} type="text" placeholder="e.g. Billify Store" value={profile.shop_name} onChange={e => handleProfileChange('shop_name', e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Email</label>
                          <input className={styles.formInput} type="email" placeholder="shop@example.com" value={profile.email} onChange={e => handleProfileChange('email', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Phone Number</label>
                          <input className={styles.formInput} type="text" placeholder="+94 77 000 0000" value={profile.phone} onChange={e => handleProfileChange('phone', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Address</label>
                          <input className={styles.formInput} type="text" placeholder="123 Main St, Colombo" value={profile.address} onChange={e => handleProfileChange('address', e.target.value)} />
                        </div>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                          {profileError && <p className={styles.errorMsg}>{profileError}</p>}
                          <div className={styles.formActions}>
                            {profileSuccess && <span className={styles.successMsg}><CheckCircle size={14} />{profileSuccess}</span>}
                            <Button variant="primary" type="submit" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save Profile'}</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}

          {}
          {mainTab === 'widget' && (
            <>
              <div className={styles.contentHeader}>
                <div>
                  <h2 className={styles.contentTitle}>Website Widget</h2>
                </div>
              </div>
              <div className={styles.contentBody}>
                {profileLoading ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Loading...</p>
                ) : !apiKey ? (
                  <div className={styles.warningBox}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span>
                      No API key found. Please go to <strong>Shop Profile</strong> and save your profile first.
                      A key will be auto-generated on the first save.
                    </span>
                  </div>
                ) : (
                  <div className={styles.widgetSection}>
                    {}
                    <div className={styles.widgetInfo}>
                      <p className={styles.widgetInfoTitle}>How it works</p>
                      <p className={styles.widgetInfoText}>
                        Copy and paste the HTML snippet below into any page of your shop's website.
                        When a customer fills in the form, the ticket is automatically created in your CRM Tickets page
                        and all staff are notified in real time.
                      </p>
                    </div>

                    <div className={styles.widgetSteps}>
                      <div className={styles.widgetStep}><span className={styles.widgetStepNum}>1</span><span>Copy the HTML snippet below.</span></div>
                      <div className={styles.widgetStep}><span className={styles.widgetStepNum}>2</span><span>Paste it into your website's HTML, e.g. in your Contact or Support page.</span></div>
                      <div className={styles.widgetStep}><span className={styles.widgetStepNum}>3</span><span>Customer submits form → ticket appears instantly in your CRM with <strong>source: Web Portal</strong>.</span></div>
                    </div>

                    {}
                    <div className={styles.apiKeyBox}>
                      <span className={styles.apiKeyLabel}>Your Public API Key</span>
                      <div className={styles.apiKeyRow}>
                        <input className={styles.apiKeyInput} type="text" readOnly value={apiKey} />
                        <button className={`${styles.copyBtn} ${keyCopied ? styles.copyBtnSuccess : ''}`} onClick={handleCopyKey}>
                          <Copy size={13} />{keyCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button className={styles.regenBtn} onClick={handleRegenKey} disabled={regenLoading}>
                          <RefreshCw size={13} />{regenLoading ? 'Regenerating...' : 'Regenerate'}
                        </button>
                      </div>
                    </div>

                    {}
                    <div className={styles.warningBox}>
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <span>
                        Keep this key safe. Do not share it privately. If your key is compromised, click <strong>Regenerate</strong> — your current widget will stop working until you replace the snippet on your website.
                      </span>
                    </div>

                    {}
                    <div className={styles.snippetBox}>
                      <div className={styles.snippetLabel}>
                        <span><Code2 size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />Embeddable HTML Snippet</span>
                      </div>
                      <pre className={styles.snippetCode}>{buildSnippet(apiKey)}</pre>
                      <div className={styles.snippetFooter}>
                        <button className={`${styles.copyBtn} ${snippetCopied ? styles.copyBtnSuccess : ''}`} onClick={handleCopySnippet}>
                          <Copy size={13} />{snippetCopied ? 'Copied!' : 'Copy Snippet'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {}
          {mainTab === 'customfields' && (
            <>
              <div className={styles.contentHeader}>
                <div><h2 className={styles.contentTitle}>Custom Fields</h2></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={styles.cfEntityTabs}>
                    {CF_TABS.map(t => (
                      <button key={t.key} className={`${styles.cfTab} ${cfTab === t.key ? styles.cfTabActive : ''}`} onClick={() => setCfTab(t.key)}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <Button variant="primary" icon={Plus} onClick={() => setIsCfModalOpen(true)}>Add Field</Button>
                </div>
              </div>

              {}
              <div className={styles.suggestedFieldsBox}>
                <h3 className={styles.suggestedFieldsTitle}>Suggested Fields for {CF_TABS.find(t => t.key === cfTab)?.label}</h3>
                <div className={styles.suggestedFieldsGrid}>
                  {PREDEFINED_FIELDS[cfTab].map(predef => {
                    const isEnabled = cfFields.some(f => f.field_name === predef.field_name);
                    return (
                      <label key={predef.field_name} className={styles.suggestedFieldCard}>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => handleTogglePredefinedField(predef, e.target.checked)}
                          className={styles.suggestedFieldCheckbox}
                        />
                        <div className={styles.suggestedFieldInfo}>
                          <span className={styles.suggestedFieldLabel}>{predef.field_label}</span>
                          <span className={styles.suggestedFieldType}>{predef.field_type}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.fieldList}>
                {cfLoading ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Loading fields...</p>
                ) : cfFields.length === 0 ? (
                  <div className={styles.emptyFields}>No custom fields defined for {cfTab}s yet.</div>
                ) : (
                  cfFields.map(field => (
                    <div key={field.id} className={styles.fieldCard}>
                      <div className={styles.fieldInfo}>
                        <span className={styles.fieldLabel}>{field.field_label}</span>
                        <div className={styles.fieldMeta}>
                          <span className={styles.badge}>{field.field_type.toUpperCase()}</span>
                          <span>Key: {field.field_name}</span>
                          {field.is_required && <span className={`${styles.badge} ${styles.badgeRequired}`}>Required</span>}
                          {field.field_type === 'select' && field.options && <span>Options: {Array.isArray(field.options) ? field.options.join(', ') : (typeof field.options === 'string' && field.options.startsWith('[') ? JSON.parse(field.options).join(', ') : field.options)}</span>}
                        </div>
                      </div>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteCfField(field.id)} title="Delete field">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {}
      <Modal
        isOpen={isCfModalOpen}
        onClose={() => setIsCfModalOpen(false)}
        maxWidth="400px"
        title={`Add Custom Field — ${CF_TABS.find(t => t.key === cfTab)?.label}`}
        footer={
          <>
            <Button variant="primary" onClick={handleSaveCfField}>Save Field</Button>
          </>
        }
      >
        <form onSubmit={handleSaveCfField}>
          <FormField label="Field Label" name="field_label" value={cfForm.field_label} onChange={e => setCfForm({ ...cfForm, field_label: e.target.value })} required placeholder="e.g. LinkedIn URL" />
          <FormField label="Field Key (Optional)" name="field_name" value={cfForm.field_name} onChange={e => setCfForm({ ...cfForm, field_name: e.target.value })} placeholder="Auto-generated if left blank" />
          <FormField
            label="Field Type" type="select" name="field_type" value={cfForm.field_type}
            onChange={e => setCfForm({ ...cfForm, field_type: e.target.value })}
            options={[
              { value: 'text', label: 'Text (Single Line)' },
              { value: 'number', label: 'Number' },
              { value: 'date', label: 'Date' },
              { value: 'checkbox', label: 'Checkbox (Yes/No)' },
              { value: 'select', label: 'Dropdown (Select)' },
            ]}
          />
          {cfForm.field_type === 'select' && (
            <FormField label="Dropdown Options (Comma separated)" name="options" value={cfForm.options} onChange={e => setCfForm({ ...cfForm, options: e.target.value })} required placeholder="e.g. Bronze, Silver, Gold" />
          )}
          <div className={styles.checkboxGroup}>
            <input type="checkbox" id="cfIsRequired" checked={cfForm.is_required} onChange={e => setCfForm({ ...cfForm, is_required: e.target.checked })} />
            <label htmlFor="cfIsRequired">Make this field required</label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
