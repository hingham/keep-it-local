// Add this before the sendMail call in your POST function
const getEmailHtmlForItemCreation = (type: "event" | "service", internal_creator_contact: string, title: string, internal_id: string) => {
  const typeTitleCase = type.charAt(0).toUpperCase() + type.slice(1);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${type} Submitted - The Local Board</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #8B5A2B;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #8B5A2B;
          margin: 0;
          font-size: 28px;
        }
        .item-details {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #8B5A2B;
        }
        .detail-row {
          margin: 10px 0;
          display: flex;
          flex-wrap: wrap;
        }
        .detail-label {
          font-weight: bold;
          color: #555;
          min-width: 120px;
          margin-right: 10px;
        }
        .detail-value {
          color: #333;
          flex: 1;
        }
        .important-info {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .removal-info {
          background-color: #e8f4fd;
          border: 1px solid #bee5eb;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        .categories {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .category-tag {
          background-color: #8B5A2B;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          text-transform: capitalize;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>The Local Board</h1>
          <p style="color: #666; margin: 10px 0 0 0;">${typeTitleCase} Submission Confirmed</p>
        </div>
    
        <p>Thank you for submitting your ${type}! Your listing has been received and will be reviewed before being published.</p>
    
        <div class="important-info">
          <strong>🔑 Your ${type} ID:</strong> <code style="background: #f1f1f1; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${internal_id || 'Not assigned'}</code>
          <br><br>
          <strong>Please save this ID!</strong> You'll need it to make changes or remove your ${type} later.
        </div>
    
        <div class="item-details">
          <h3 style="margin-top: 0; color: #8B5A2B;">${type} Details</h3>
          
          <div class="detail-row">
            <span class="detail-label">Title:</span>
            <span class="detail-value">${title}</span>
          </div>
          
        
        </div>
    
        <div class="removal-info">
          <h4 style="margin-top: 0; color: #0c5460;">Need to make changes or remove your ${type}?</h4>
          <p style="margin-bottom: 10px;">You can request removal of your ${type} at any time by visiting our removal page and providing either:</p>
          <ul style="margin: 10px 0;">
            <li><strong>Your ${type} ID:</strong> <code>${internal_id || 'Not assigned'}</code></li>
            <li><strong>Or your email address:</strong> ${internal_creator_contact}</li>
          </ul>
          <p style="margin-bottom: 0;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/remove-listing" style="color: #8B5A2B;">Visit Removal Page →</a></p>
        </div>
    
        <p><strong>What happens next?</strong></p>
        <ol>
          <li>Our team will review your ${type} submission</li>
          <li>Once approved, your ${type} will appear on The Local Board</li>
          <li>Community members can discover and attend your ${type}</li>
        </ol>
    
        <p>If you have any questions, please contact our support team.</p>
    
        <div class="footer">
          <p>Thank you for supporting local community ${type}s!</p>
          <p style="margin: 5px 0 0 0;">- The Local Board Team</p>
        </div>
      </div>
    </body>
    </html>
    `;
}

export { getEmailHtmlForItemCreation }
