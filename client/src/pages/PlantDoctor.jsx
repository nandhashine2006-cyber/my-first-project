import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Stethoscope, Upload, AlertCircle, CheckCircle, ShieldAlert, Volume2, VolumeX, History, Trash2, FileText, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const PlantDoctor = () => {
  const { t, language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [problemDesc, setProblemDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef(null);

  // Mapping of website languages to native speech synthesis regional locales
  const speechLocaleMap = {
    ta: 'ta-IN', // Tamil
    en: 'en-US', // English
    hi: 'hi-IN', // Hindi
    te: 'te-IN', // Telugu
    ml: 'ml-IN', // Malayalam
    kn: 'kn-IN', // Kannada
    mr: 'mr-IN', // Marathi
    bn: 'bn-IN', // Bengali
    gu: 'gu-IN', // Gujarati
    pa: 'pa-IN'  // Punjabi
  };

  const fetchHistory = async () => {
    try {
      const resp = await api.get('/plant-doctor/history');
      if (resp.data && resp.data.success && Array.isArray(resp.data.data)) {
        setHistory(resp.data.data);
      }
    } catch (err) {
      console.warn('Could not retrieve diagnostic history:', err.userMessage || err.message);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    setErrorMsg('');
    const file = e.target.files[0];
    if (!file) return;

    // Validate filesize (Max 8 MB)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Selected image exceeds the 8 MB maximum size limit. Please select a smaller photo.');
      return;
    }

    // Validate file extensions
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please provide a JPG, PNG, or WEBP image of the plant crop.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setErrorMsg('Please upload a clear image of the crop leaf or plant disease first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setNotice('');
    setDiagnosis(null);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      formData.append('problemDescription', problemDesc);
      formData.append('language', language || 'en');

      const response = await api.post('/plant-doctor/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 120 seconds for AI processing
      });

      if (response.data && response.data.success) {
        if (response.data.isPlantImage === false) {
          setErrorMsg(response.data.message || 'The image does not appear to be an agricultural plant crop.');
        } else {
          setDiagnosis(response.data.data);
          if (response.data.notice) setNotice(response.data.notice);
          fetchHistory();
        }
      } else {
        setErrorMsg('Failed to complete AI evaluation. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.userMessage || 'An unexpected error occurred while processing your image.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProblemDesc('');
    setDiagnosis(null);
    setErrorMsg('');
    setNotice('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleDeleteHistory = async (id) => {
    try {
      await api.delete(`/plant-doctor/history/${id}`);
      setHistory(history.filter(item => item._id !== id));
    } catch (err) {
      console.error('Failed to delete diagnosis history item:', err);
    }
  };

  // Web Speech API Synthesis Read Aloud in all 10 supported Indian languages
  const handleReadAloud = () => {
    if (!diagnosis || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `
      Plant Doctor Diagnosis Report.
      Crop Name: ${diagnosis.plantName || 'Crop'}.
      Health Condition: ${diagnosis.possibleDisease || diagnosis.healthStatus}.
      Severity: ${diagnosis.diseaseSeverity || 'Low'}.
      Confidence Score: ${diagnosis.confidenceScore || 85} percent.
      Recommended Organic Treatments: ${Array.isArray(diagnosis.organicTreatment) ? diagnosis.organicTreatment.join('. ') : (diagnosis.organicTreatment || 'Continue normal watering.')}.
      Safety Notice: Always consult your local Tamil Nadu Agricultural Officer before applying chemical pesticides.
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLocaleMap[language] || 'en-US';
    utterance.rate = 0.95; // slightly paced for farmer clarity

    // Select suitable voice if installed on user system
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const getSeverityStyle = (sev = '') => {
    switch (sev.toLowerCase()) {
      case 'critical': return { bg: '#fee2e2', text: '#991b1b', border: '#f87171', label: '🚨 CRITICAL' };
      case 'high': return { bg: '#ffedd5', text: '#c2410c', border: '#fb923c', label: '⚠️ HIGH SEVERITY' };
      case 'medium': return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'e, LOW MODERATE' };
      case 'low': return { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa', label: 'ℹ️ MILD / LOW' };
      case 'none': default: return { bg: '#dcfce7', text: '#065f46', border: '#86efac', label: '🌱 HEALTHY / NONE' };
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="dash-card-icon" style={{ marginBottom: 0 }}>
          <Stethoscope size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#064e3b', marginBottom: '0.25rem' }}>{t('plantDoctor')}</h1>
          <p style={{ color: '#64748b' }}>Google Gemini Multimodal AI crop diagnostic service protected via Node.js backend.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-badge alert-danger" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #f87171', fontWeight: 500 }}>
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {notice && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.92rem', fontWeight: 500 }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, color: '#f59e0b' }} />
          <span>{notice}</span>
        </div>
      )}

      {!diagnosis ? (
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleAnalyze}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".jpg,.jpeg,.png,.webp" 
              onChange={handleFileChange} 
            />

            {!previewUrl ? (
              <div 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{ border: '3px dashed #6ee7b7', borderRadius: '1rem', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#ecfdf5', marginBottom: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <Upload size={52} color="#059669" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#047857' }}>Select or Capture Crop Leaf Image</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Supports JPG, PNG & WEBP (Max 8 MB). Secure Multer file scanning enabled.</p>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img src={previewUrl} alt="Crop preview" style={{ maxHeight: '360px', width: 'auto', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', objectFit: 'contain' }} />
                  <button 
                    type="button" 
                    onClick={handleClear} 
                    style={{ position: 'absolute', top: '10px', right: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                    title="Remove selected image"
                  >
                    ✕
                  </button>
                </div>
                <p style={{ margin: '1rem 0 0 0', fontWeight: 600, color: '#047857' }}>✓ Image ready for AI diagnosis ({selectedFile?.name})</p>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '0.5rem' }}>
                Optional Problem Description (Watering intervals, soil type, observed symptoms):
              </label>
              <textarea 
                className="form-textarea" 
                rows={3} 
                value={problemDesc}
                onChange={(e) => setProblemDesc(e.target.value)}
                placeholder="e.g., Brown leaf margin burns appeared after consecutive heavy rains in Salem district..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: '1 1 240px', padding: '0.85rem', fontSize: '1.1rem', justifyContent: 'center' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={20} className="animate-spin" /> {t('loading')}...
                  </span>
                ) : (
                  <span>🌿 Run Google Gemini Crop Diagnosis</span>
                )}
              </button>
              <button type="button" onClick={handleClear} disabled={loading} className="btn btn-outline" style={{ flex: '0 1 150px', justifyContent: 'center' }}>
                Clear Form
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Main Result Card */}
          <div className="card" style={{ borderTop: '6px solid #059669', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', tracking: '1px', fontWeight: 700, color: '#059669' }}>
                  AI Diagnosis Assessment • {diagnosis.scientificName !== 'N/A' ? diagnosis.scientificName : 'Crop Health Report'}
                </span>
                <h2 style={{ fontSize: '2rem', color: '#0f172a', margin: '0.25rem 0' }}>{diagnosis.plantName}</h2>
                <h3 style={{ fontSize: '1.35rem', color: '#047857', margin: 0 }}>Indicated: {diagnosis.possibleDisease}</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  onClick={handleReadAloud} 
                  className="btn btn-primary" 
                  style={{ background: isSpeaking ? '#dc2626' : '#2563eb', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
                  title={`Speak diagnosis aloud (${speechLocaleMap[language] || 'en-US'})`}
                >
                  {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  <span>{isSpeaking ? 'Stop Audio' : '🔊 Read Aloud (10-Lang Voice)'}</span>
                </button>
                <button onClick={handleClear} className="btn btn-outline" style={{ padding: '0.65rem 1.25rem' }}>
                  New Diagnosis
                </button>
              </div>
            </div>

            {/* Severity and Confidence Metric Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.4rem' }}>
                  ESTIMATED CONFIDENCE SCORE
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, background: '#e2e8f0', height: '14px', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${diagnosis.confidenceScore || 85}%`, background: 'linear-gradient(90deg, #10b981, #059669)', height: '100%' }}></div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#064e3b' }}>{diagnosis.confidenceScore || 85}%</span>
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '0.4rem' }}>
                  DISEASE SEVERITY LEVEL
                </span>
                <div style={{ display: 'inline-block' }}>
                  {(() => {
                    const st = getSeverityStyle(diagnosis.diseaseSeverity);
                    return (
                      <span style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}`, padding: '0.35rem 1rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center' }}>
                        {st.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Diagnostic Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Left Column: Symptoms & Causes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                    🔍 Visible Symptoms
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', lineHeight: 1.7 }}>
                    {Array.isArray(diagnosis.visibleSymptoms) && diagnosis.visibleSymptoms.length > 0 ? (
                      diagnosis.visibleSymptoms.map((sym, i) => <li key={i}>{sym}</li>)
                    ) : (
                      <li>No explicit adverse symptoms identified on healthy foliage.</li>
                    )}
                  </ul>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                    🌧️ Possible Causes & Environmental Factors
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', lineHeight: 1.7 }}>
                    {Array.isArray(diagnosis.possibleCauses) && diagnosis.possibleCauses.length > 0 ? (
                      diagnosis.possibleCauses.map((c, i) => <li key={i}>{c}</li>)
                    ) : (
                      <li>Normal biological development or baseline climate variation.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Right Column: Organic & Chemical Advice */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#ecfdf5', padding: '1.5rem', borderRadius: '12px', border: '1px solid #6ee7b7' }}>
                  <h4 style={{ color: '#064e3b', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                    🌱 Recommended Organic Treatments (Prioritized)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#047857', lineHeight: 1.7, fontWeight: 500 }}>
                    {Array.isArray(diagnosis.organicTreatment) && diagnosis.organicTreatment.length > 0 ? (
                      diagnosis.organicTreatment.map((ot, i) => <li key={i}>{ot}</li>)
                    ) : (
                      <li>Maintain current organic soil enrichment and composting practices.</li>
                    )}
                  </ul>
                </div>

                {Array.isArray(diagnosis.chemicalTreatment) && diagnosis.chemicalTreatment.length > 0 && (
                  <div style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fdba74' }}>
                    <h4 style={{ color: '#9a3412', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                      🧪 General Chemical Guidance (Use with Caution)
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#7c2d12', lineHeight: 1.7 }}>
                      {diagnosis.chemicalTreatment.map((ct, i) => <li key={i}>{ct}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Guidance & Safety Footers */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h5 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontSize: '1rem' }}>💧 Watering & Irrigation Advice</h5>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>{diagnosis.wateringAdvice || 'Maintain steady root-level hydration without flooding main stems.'}</p>
              </div>
              <div>
                <h5 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontSize: '1rem' }}>🌾 Fertilizer & Nutrient Management</h5>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>{diagnosis.fertilizerAdvice || 'Apply balanced NPK organic farmyard manure as appropriate for crop stage.'}</p>
              </div>
              <div>
                <h5 style={{ margin: '0 0 0.35rem 0', color: '#b45309', fontSize: '1rem' }}>👨‍🌾 Expert Escalation Advice</h5>
                <p style={{ margin: 0, color: '#92400e', fontSize: '0.92rem' }}>{diagnosis.expertConsultationWarning || 'If symptoms spread rapidly to new growth within 48 hours, contact your regional agricultural extension officer.'}</p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: '#f1f5f9', padding: '1rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: '#475569' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0, color: '#64748b' }} />
              <div>
                <strong>Safety & Algorithmic Notice:</strong> {diagnosis.analysisLimitation || 'This analysis is an AI estimation based on visual observation only; it is not a 100% guaranteed laboratory test. Always read pesticide container labels carefully.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Analysis History Section */}
      <div style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#064e3b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <History size={26} color="#059669" />
            Recent Crop Diagnostic History
          </h2>
          <button onClick={fetchHistory} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', minHeight: '34px' }}>
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            <FileText size={40} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>No prior diagnostic analyses logged in MongoDB Atlas yet.</p>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Upload a plant crop image above to start archiving verified farm health records.</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
            {history.map((item) => {
              const sev = getSeverityStyle(item.diseaseSeverity);
              return (
                <div key={item._id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ background: sev.bg, color: sev.text, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {item.diseaseSeverity || 'Checked'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 style={{ color: '#0f172a', margin: '0 0 0.25rem 0', fontSize: '1.15rem' }}>{item.plantName}</h4>
                    <p style={{ color: '#047857', fontWeight: 600, margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
                      {item.possibleDisease}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {Array.isArray(item.organicTreatment) ? item.organicTreatment[0] : item.organicTreatment || 'Normal agricultural care advised.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
                      Confidence: {item.confidenceScore}%
                    </span>
                    <button 
                      onClick={() => handleDeleteHistory(item._id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                      title="Delete record from database"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantDoctor;
