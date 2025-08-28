import React from 'react';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#111827', 
          marginBottom: '16px' 
        }}>
          {title}
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px', 
          marginBottom: '32px' 
        }}>
          {description}
        </p>
        <div style={{ 
          backgroundColor: '#eff6ff', 
          padding: '20px', 
          borderRadius: '6px',
          border: '1px solid #dbeafe'
        }}>
          <p style={{ 
            color: '#1e40af', 
            fontSize: '14px', 
            margin: 0 
          }}>
            🚧 This page is currently under development. 
            The backend API is ready, but the frontend interface needs to be built.
          </p>
        </div>
        <div style={{ marginTop: '24px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            You can access the API directly at: 
            <br/>
            <code style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              http://127.0.0.1:8000/api/
            </code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
