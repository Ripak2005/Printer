import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import '../styles/AdminPanel.css';

export default function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'printed'
  const [message, setMessage] = useState(null);

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  // Fetch orders on component mount and set auto-refresh
  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Mark order as printed
  const handleMarkPrinted = async (orderId) => {
    try {
      await axios.put(`/api/order/${orderId}`);
      setMessage({ type: 'success', text: 'Order marked as printed' });
      setTimeout(fetchOrders, 300);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update order' });
    }
  };

  // Download file, package into a ZIP with a folder named by date-time
  // Requires dependencies: jszip and file-saver
  const handleDownload = async (orderId, fileName) => {
    try {
      const response = await axios.get(`/api/order/${orderId}/download`, {
        responseType: 'blob'
      });

      // Determine filename
      const contentDisposition = response.headers['content-disposition'];
      let suggestedName = fileName || 'download';

      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=([^;]+)/i);
        if (match) {
          suggestedName = match[1].replace(/UTF-8''/, '').replace(/"/g, '').trim();
        }
      }

      // Create folder name based on current date-time
      const now = new Date();
      const folderName = now.toISOString().replace(/[:.]/g, '-');

      // Create ZIP and add file inside folder
      const zip = new JSZip();
      const folder = zip.folder(folderName);
      folder.file(suggestedName, response.data);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${folderName}.zip`);
    } catch (error) {
      console.error('Download (zip) error:', error);
      setMessage({ type: 'error', text: 'Failed to download file' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Delete order
  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`/api/order/${orderId}`);
        setMessage({ type: 'success', text: 'Order deleted' });
        setTimeout(fetchOrders, 300);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete order' });
      }
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'printed') return order.status === 'printed';
    return true;
  });

  // Format date and time
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🖨️ Print Shop Admin Panel</h1>
        <p>Manage all print orders</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`notification ${message.type}`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="filter-section">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button
          className={`filter-btn ${filter === 'printed' ? 'active' : ''}`}
          onClick={() => setFilter('printed')}
        >
          Printed ({orders.filter(o => o.status === 'printed').length})
        </button>
      </div>

      {/* Orders List */}
      <div className="orders-section">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            No orders found
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div key={order.id} className={`order-card ${order.status}`}>
                {/* Status Badge */}
                <div className="order-status">
                  {order.status === 'pending' ? '⏳ Pending' : '✓ Printed'}
                </div>

                {/* Order Header */}
                <div className="order-info">
                  <h3>{order.name}</h3>
                  <p className="phone">📱 {order.phone}</p>
                </div>

                {/* File Info */}
                <div className="file-info">
                  <small>File: {order.originalFileName}</small>
                  <small>Size: {(order.fileSize / 1024).toFixed(2)} KB</small>
                </div>

                {/* Print Options */}
                <div className="print-options">
                  <span>Copies: <strong>{order.copies}</strong></span>
                  <span>Color: <strong>{order.color === 'bw' ? 'B&W' : 'Color'}</strong></span>
                  <span>Paper: <strong>{order.paperSize.toUpperCase()}</strong></span>
                </div>

                {/* Timestamp */}
                <div className="timestamp">
                  📅 {formatDateTime(order.uploadTime)}
                </div>

                {/* Comments */}
                {order.comments && (
                  <div className="comments-box">
                    <strong>💬 Comments:</strong>
                    <p>{order.comments}</p>
                  </div>
                )}

                {order.printedTime && (
                  <div className="printed-time">
                    ✓ Printed: {formatDateTime(order.printedTime)}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    className="btn-download"
                    onClick={() => handleDownload(order.id, order.originalFileName)}
                    title="Download file"
                  >
                    📥 Download
                  </button>

                  {order.status === 'pending' && (
                    <button
                      className="btn-print"
                      onClick={() => handleMarkPrinted(order.id)}
                      title="Mark as printed"
                    >
                      ✓ Mark Printed
                    </button>
                  )}

                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(order.id)}
                    title="Delete order"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="admin-footer">
        <small>Last updated: {new Date().toLocaleTimeString()} | Auto-refreshing every 5 seconds</small>
      </div>
    </div>
  );
}
