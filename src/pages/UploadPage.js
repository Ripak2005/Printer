import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Upload.css';
import { translations } from '../translations';

export default function UploadPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    copies: '1',
    color: 'bw',
    paperSize: 'a4',
    comments: ''
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [language, setLanguage] = useState('en');

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
  }, []);

  // Save language preference to localStorage
  const toggleLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => translations[language][key] || translations.en[key];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileName = selectedFile.name.toLowerCase();
      
      const isValidType = validTypes.includes(selectedFile.type) || 
                          validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidType) {
        setMessageType('error');
        setMessage(t('onlyPDFJPGPNG'));
        setFile(null);
        return;
      }
      
      // No client-side size limit enforced (server controls limits)

      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessageType('error');
      setMessage(t('pleaseSelectFile'));
      return;
    }

    if (!formData.name || !formData.phone) {
      setMessageType('error');
      setMessage(t('pleaseEnterAllFields'));
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('phone', formData.phone);
      uploadFormData.append('copies', formData.copies);
      uploadFormData.append('color', formData.color);
      uploadFormData.append('paperSize', formData.paperSize);
      uploadFormData.append('comments', formData.comments);

      const response = await axios.post('/api/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessageType('success');
      setMessage(t('successMessage'));
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: '',
          phone: '',
          copies: '1',
          color: 'bw',
          comments: '',
          paperSize: 'a4'
        });
        setFile(null);
        document.getElementById('fileInput').value = '';
      }, 2000);

    } catch (error) {
      setMessageType('error');
      setMessage(error.response?.data?.error || t('uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        {/* Language Toggle */}
        <div className="language-toggle">
          <button
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => toggleLanguage('en')}
          >
            English
          </button>
          <button
            className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
            onClick={() => toggleLanguage('hi')}
          >
            हिंदी
          </button>
        </div>

        <div className="upload-header">
          <h1>{t('printYourDocument')}</h1>
          <p>{t('uploadCustomizeSubmit')}</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* File Upload */}
          <div className="form-group">
            <label htmlFor="fileInput" className="form-label">
              {t('chooseFile')}
            </label>
            <div className="file-input-wrapper">
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="file-input"
              />
              <span className="file-name">
                {file ? file.name : t('selectPDFOrImage')}
              </span>
            </div>
            <small className="helper-text">
              {t('supported')}
            </small>
          </div>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {t('yourName')}
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('enterYourName')}
              className="form-input"
              maxLength="50"
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              {t('phoneNumber')}
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={t('enterPhoneNumber')}
              className="form-input"
              maxLength="15"
              required
            />
          </div>

          {/* Copies */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="copies" className="form-label">
                {t('numberOfCopies')}
              </label>
              <input
                id="copies"
                type="number"
                name="copies"
                value={formData.copies}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="form-input"
                required
              />
            </div>

            {/* Color */}
            <div className="form-group">
              <label htmlFor="color" className="form-label">
                {t('color')}
              </label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="bw">{t('blackAndWhite')}</option>
                <option value="color">{t('colorPrinting')}</option>
              </select>
            </div>

            {/* Paper Size */}
            <div className="form-group">
              <label htmlFor="paperSize" className="form-label">
                {t('paperSize')}
              </label>
              <select
                id="paperSize"
                name="paperSize"
                value={formData.paperSize}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
              </select>
            </div>
          </div>

          {/* Comments */}
          <div className="form-group">
            <label htmlFor="comments" className="form-label">
              {t('specialInstructions')}
            </label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder={t('enterSpecialInstructions')}
              className="form-textarea"
              rows="3"
              maxLength="500"
            />
            <small className="helper-text">
              {t('maxCharacters')}
            </small>
          </div>

          {/* 
          {/* Message Display */}
          {message && (
            <div className={`message ${messageType}`}>
              {messageType === 'success' ? '✓' : '✕'} {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span> Uploading...
              </>
            ) : (
              '📤 Submit Order'
            )}
          </button>
        </form>

        <div className="footer-text">
          <small>Your order will be ready for pickup soon!</small>
        </div>
      </div>
    </div>
  );
}
