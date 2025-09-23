import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/api-helpers';

export async function POST(request: Request) {
    try {
        const { name, email, subject, message, listingUrl } = await request.json();

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Name, email, subject, and message are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // Create email content
        const emailSubject = `Support Request: ${subject}`;
        const emailText = ` Support Request from The Local Board
            Name: ${name}
            Email: ${email}
            Subject: ${subject}
            ${listingUrl ? `Related Listing: ${listingUrl}` : ''}

            Message:
            ${message}

            ---
            Sent from The Local Board Support Form
            `.trim();

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px;">
                Support Request from The Local Board
                </h2>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                ${listingUrl ? `<p><strong>Related Listing:</strong> <a href="${listingUrl}">${listingUrl}</a></p>` : ''}
                </div>
                
                <div style="margin: 20px 0;">
                <h3 style="color: #333;">Message:</h3>
                <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #007bff; border-radius: 3px;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
                <p style="font-size: 12px; color: #666;">
                This message was sent from the The Local Board Support Form
                </p>
            </div>
        `;

        // Send email to support team
        sendMail(emailSubject, emailText, emailHtml, process.env.SUPPORT_EMAIL || 'support@keepitlocal.com')

        const userEmailText = `
            Hi ${name},

            Thank you for contacting The Local Board support. We've received your message and will get back to you as soon as possible, typically within 24-48 hours.

            Your message:
            Subject: ${subject}
            ${listingUrl ? `Related Listing: ${listingUrl}` : ''}

            Message: ${message}

            If you have any urgent concerns, please don't hesitate to reach out again.

            Best regards,
            The Local Board Support Team
        `;

        const userHtmlContext = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank you for contacting us!</h2>
            
            <p>Hi ${name},</p>
            
            <p>Thank you for contacting The Local Board support. We've received your message and will get back to you as soon as possible, typically within 24-48 hours.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your message:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                ${listingUrl ? `<p><strong>Related Listing:</strong> <a href="${listingUrl}">${listingUrl}</a></p>` : ''}
                <p><strong>Message:</strong></p>
                <div style="background-color: #ffffff; padding: 10px; border-radius: 3px;">
                ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <p>If you have any urgent concerns, please don't hesitate to reach out again.</p>
            
            <p>Best regards,<br>
            The Local Board Support Team</p>
            </div>
        `;

        const userSubject = "We've received your support request";

        sendMail(userSubject, userEmailText, userHtmlContext, email)


        return NextResponse.json({
            success: true,
            message: 'Support request sent successfully',
        });

    } catch (error) {
        console.error('Error sending support message:', error);
        return NextResponse.json(
            { error: 'Failed to send support message' },
            { status: 500 }
        );
    }
}
