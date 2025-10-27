import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { sendMail, isDevelopmentMode } from '@/lib/api-helpers';
import { AdminEvent, CreateEvent, Event } from '@/types/events'
import OpenAI from 'openai';
import { CreateEvalCompletionsRunDataSource } from 'openai/resources/evals.mjs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EventModerationResult {
  eventId: number;
  contentAppropriate: boolean;
  contentReason?: string;
  imageAppropriate: boolean;
  imageReason?: string;
  overallApproved: boolean;
}

interface ImageAnalysisResult {
  appropriate: boolean;
  reason?: string;
}

interface ContentAnalysisResult {
  appropriate: boolean;
  reason?: string;
}

/**
 * Agent endpoint for automated event moderation
 * Triggered by cron job to process unverified events
 * Agent activated over api
 * Code action: get unverified events
 * For each verified event
 * Task: determine if this event is an appropriate event. If not, say why not. Keep answer respectful. return data as json.
 * 
 * Task: determine if this photo is appropriate for viewing. If not, say why not. Keep answer respectful. return data as json.
 * 
 * Code action: update verified events, if both are appropriate
 * Code action: email users if event is verified.
 * Code action: email users why event was not verified if not verified
 *
 */
export async function POST(request: Request) {
  try {
    // Verify this is coming from a cron job (optional security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log({cronSecret})
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Agent moderation started');

    // Get all unverified events
    const unverifiedEvents = await getUnverifiedEvents();
    console.log(`Found ${unverifiedEvents.length} unverified events to process`);

    if (unverifiedEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unverified events to process',
        processed: 0
      });
    }

    const results: EventModerationResult[] = [];

    // Process each unverified event
    for (const event of unverifiedEvents) {
      console.log(`Processing event: ${event.title} (ID: ${event.id})`);
      
      try {
        // Analyze event content
        const contentAnalysis = await analyzeEventContent(event);
        
        // Analyze event image (if exists)
        const imageAnalysis = event.imageurl 
          ? await analyzeEventImage(event.imageurl)
          : { appropriate: true }; // No image means no image concerns

        const overallApproved = contentAnalysis.appropriate && imageAnalysis.appropriate;

        const result: EventModerationResult = {
          eventId: event.id,
          contentAppropriate: contentAnalysis.appropriate,
          contentReason: contentAnalysis.reason,
          imageAppropriate: imageAnalysis.appropriate,
          imageReason: imageAnalysis.reason,
          overallApproved
        };

        results.push(result);

        // Update event verification status
        await updateEventVerification(event.id, overallApproved);

        // Send email notification
        await sendVerificationEmail(event, result);

        console.log(`Processed event ${event.id}: ${overallApproved ? 'APPROVED' : 'REJECTED'}`);

      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        // Continue processing other events even if one fails
        results.push({
          eventId: event.id,
          contentAppropriate: false,
          contentReason: 'Processing error occurred',
          imageAppropriate: false,
          imageReason: 'Processing error occurred',
          overallApproved: false
        });
      }
    }

    const approvedCount = results.filter(r => r.overallApproved).length;
    const rejectedCount = results.length - approvedCount;

    console.log(`🎉 Agent moderation completed: ${approvedCount} approved, ${rejectedCount} rejected`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} events`,
      processed: results.length,
      approved: approvedCount,
      rejected: rejectedCount,
      results: isDevelopmentMode() ? results : undefined // Only return detailed results in dev
    });

  } catch (error) {
    console.error('Agent moderation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during moderation',
        details: isDevelopmentMode() ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Get all unverified events from the database
 */
async function getUnverifiedEvents(): Promise<AdminEvent []> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        e.*,
        n.neighborhood,
        c.city,
        c.state, 
        n.macro_neighborhood 
      FROM events e
      JOIN neighborhoods n ON e.neighborhood_id = n.id
      JOIN cities c ON n.city_id = c.id
      WHERE e.verified = false
      ORDER BY e.created_at ASC
    `);
    
    return result.rows as unknown as AdminEvent[];
  } finally {
    client.release();
  }
}

/**
 * Analyze event content using OpenAI
 */
async function analyzeEventContent(event: Event): Promise<ContentAnalysisResult> {
  try {
    const prompt = `
You are a community event moderator. Please analyze this event submission and determine if it's appropriate for a local community board.

Guidelines for appropriate events:
- Must be legitimate community events or activities
- No commercial spam or pure advertising
- No inappropriate, offensive, or harmful content
- No misleading or false information
- No events promoting illegal activities
- No events with discriminatory content

Please respond with a JSON object containing:
{
  "appropriate": boolean,
  "reason": "Brief explanation if not appropriate, or null if appropriate"
}

Be respectful in your reasoning if the event is not appropriate.
`;

const eventData = `Event Details:
- Title: ${event.title}
- Description: ${event.description || 'No description provided'}
- Location: ${event.location || 'No location provided'}
- Website: ${event.website || 'No website provided'}`

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: prompt,
      input: eventData,
      temperature: 0.1,
    });

    
    const res = response.output_text;
    console.log({response, res})
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(res);
    return {
      appropriate: analysis.appropriate,
      reason: analysis.reason
    };

  } catch (error) {
    console.error('Content analysis error:', error);
    return {
      appropriate: false,
      reason: 'Unable to analyze content due to technical error'
    };
  }
}

/**
 * Analyze event image using OpenAI Vision
 */
async function analyzeEventImage(imageUrl: string): Promise<ImageAnalysisResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a content moderator analyzing images for a community event board. Respond only with valid JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this image and determine if it's appropriate for a community event board.

Guidelines:
- Must be appropriate for all ages
- No offensive, inappropriate, or harmful content
- No misleading or false imagery
- Should be relevant to community events
- No spam or purely commercial content

Respond with JSON:
{
  "appropriate": boolean,
  "reason": "Brief explanation if not appropriate, or null if appropriate"
}

Be respectful in your reasoning.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI Vision');
    }

    const analysis = JSON.parse(response);
    return {
      appropriate: analysis.appropriate,
      reason: analysis.reason
    };

  } catch (error) {
    console.error('Image analysis error:', error);
    return {
      appropriate: false,
      reason: 'Unable to analyze image due to technical error'
    };
  }
}

/**
 * Update event verification status in database
 */
async function updateEventVerification(eventId: number, verified: boolean) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE events SET verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [verified, eventId]
    );
  } finally {
    client.release();
  }
}

/**
 * Send verification email to event creator
 */
async function sendVerificationEmail(event: CreateEvent & Event, result: EventModerationResult) {
  if (!event.internal_creator_contact) {
    console.log(`No contact email for event ${event.id}, skipping email`);
    return;
  }

  try {
    const subject = result.overallApproved 
      ? `✅ Your event "${event.title}" has been approved!`
      : `❌ Your event "${event.title}" needs review`;

    const htmlContent = generateEmailContent(event, result);

    await sendMail(
      event.internal_creator_contact,
      subject,
      htmlContent
    );

    console.log(`📧 Sent ${result.overallApproved ? 'approval' : 'rejection'} email for event ${event.id}`);

  } catch (error) {
    console.error(`Failed to send email for event ${event.id}:`, error);
    // Don't throw - email failure shouldn't stop the moderation process
  }
}

/**
 * Generate email content based on moderation result
 */
function generateEmailContent(event: CreateEvent & Event, result: EventModerationResult): string {
  if (result.overallApproved) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Event Approved - The Local Board</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 8px; }
        .header { text-align: center; color: #22c55e; margin-bottom: 20px; }
        .event-details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Event Approved!</h1>
        </div>
        <p>Great news! Your event has been approved and is now live on The Local Board.</p>
        <div class="event-details">
          <h3>${event.title}</h3>
          <p><strong>Date:</strong> ${event.date}</p>
          <p><strong>Location:</strong> ${event.location || 'Not specified'}</p>
          <p><strong>Neighborhood:</strong> ${event.neighborhood}, ${event.city}</p>
        </div>
        <p>Your event is now visible to the community and people can discover it through our platform.</p>
        <p>Thank you for contributing to your local community!</p>
        <p>Best regards,<br>The Local Board Team</p>
      </div>
    </body>
    </html>
    `;
  } else {
    const reasons = [];
    if (!result.contentAppropriate && result.contentReason) {
      reasons.push(`Content: ${result.contentReason}`);
    }
    if (!result.imageAppropriate && result.imageReason) {
      reasons.push(`Image: ${result.imageReason}`);
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Event Review Needed - The Local Board</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #f9f9f9; padding: 30px; border-radius: 8px; }
        .header { text-align: center; color: #ef4444; margin-bottom: 20px; }
        .event-details { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .reasons { background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Event Review Needed</h1>
        </div>
        <p>Thank you for submitting your event to The Local Board. Unfortunately, we need to review some aspects before it can be published.</p>
        <div class="event-details">
          <h3>${event.title}</h3>
          <p><strong>Date:</strong> ${event.date}</p>
          <p><strong>Location:</strong> ${event.location || 'Not specified'}</p>
        </div>
        <div class="reasons">
          <h4>Review needed for:</h4>
          <ul>
            ${reasons.map(reason => `<li>${reason}</li>`).join('')}
          </ul>
        </div>
        <p>Please feel free to resubmit your event with any necessary adjustments. We appreciate your understanding and contribution to the community.</p>
        <p>If you have questions, please don't hesitate to reach out to us.</p>
        <p>Best regards,<br>The Local Board Team</p>
      </div>
    </body>
    </html>
    `;
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'Agent endpoint is ready',
    timestamp: new Date().toISOString()
  });
}