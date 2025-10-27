import nodemailer from "nodemailer";
import { adminEmail, domain } from "./constants";

const testAccount = await nodemailer.createTestAccount();
const isDevelopmentMode = () => {
    if (process.env.NODE_ENV == 'development') {
        return true;
    }
    return false;
}

const transporter = isDevelopmentMode() ?
 nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
        user: testAccount.user,
        pass: testAccount.pass,
    },
    tls: {
        rejectUnauthorized: false, // this fixes self-signed cert issue
    },
}) : nodemailer.createTransport({
    name: "hostinger.com",
    host: "smtp.hostinger.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "admin@thelocalboard.city",
        pass: process.env.PROD_MAIL_PASS,
    },
})


const sendMail = async (emailSubject: string, emailText: string, emailHtml: string, email?: string ) => {
    const from = `"The Local Board" <admin@${domain}>`
    
    const to = isDevelopmentMode() ? "receiver@example.com" : email;

    try {
        const info = await transporter.sendMail({
            from,
            to,
            replyTo: adminEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
        });

        console.log("Message sent:", info.messageId, email, JSON.stringify(info))
        console.log(" Email sent:", info.messageId);
        console.log(" Preview URL:", nodemailer.getTestMessageUrl(info));
    } catch (e) {
        console.error("Failed to send email: ", e)
    }
}

interface EventFiltersOptions {
  city?: string | null;
  macroNeighborhood?: string | null;
  neighborhoods?: string[] | null;
  categories?: string[] | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

interface ServiceFiltersOptions {
  city?: string | null;
  macroNeighborhood?: string | null;
  neighborhoods?: string[] | null;
  categories?: string[] | null;
}

interface EventFiltersResult {
  whereClause: string;
  queryParams: (string | string[])[];
}

/**
 * Builds WHERE clause and query parameters for event filtering
 * Can be reused across different API routes that need to filter events
 * 
 * @param options - Filter options
 * @returns Object containing WHERE clause and query parameters
 */
export function buildEventFilters(options: EventFiltersOptions): EventFiltersResult {
  const {
    city,
    macroNeighborhood,
    neighborhoods,
    categories,
    dateFrom,
    dateTo
  } = options;

  const conditions: string[] = [];
  const queryParams: (string | string[])[] = [];

  // City filter
  if (city) {
    conditions.push(`LOWER(c.city) = LOWER($${queryParams.length + 1})`);
    queryParams.push(city);
  }

  // Macro-neighborhood filter
  if (macroNeighborhood) {
    conditions.push(`LOWER(n.macro_neighborhood) = LOWER($${queryParams.length + 1})`);
    queryParams.push(macroNeighborhood);
  }

  // Neighborhoods filter (multiple neighborhoods)
  if (neighborhoods && neighborhoods.length > 0) {
    conditions.push(`LOWER(n.neighborhood) = ANY($${queryParams.length + 1})`);
    queryParams.push(neighborhoods.map(n => n.toLowerCase()));
  }

  // Categories filter (multiple categories)
  if (categories && categories.length > 0) {
    // Check if any of the specified categories exist in the event's categories array
    const categoryConditions = categories.map((_, index) => 
      `$${queryParams.length + index + 1} = ANY(e.categories)`
    );
    conditions.push(`(${categoryConditions.join(' OR ')})`);
    queryParams.push(...categories);
  }

  // Date range filters
  if (dateFrom) {
    conditions.push(`e.date >= $${queryParams.length + 1}`);
    queryParams.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`e.date <= $${queryParams.length + 1}`);
    queryParams.push(dateTo);
  }

  return {
    whereClause: conditions.join(' AND '),
    queryParams
  };
}

/**
 * Builds WHERE clause and query parameters for service filtering
 * Can be reused across different API routes that need to filter services
 * 
 * @param options - Filter options
 * @returns Object containing WHERE clause and query parameters
 */
export function buildServiceFilters(options: ServiceFiltersOptions): EventFiltersResult {
  const {
    city,
    macroNeighborhood,
    neighborhoods,
    categories
  } = options;

  const conditions: string[] = [];
  const queryParams: (string | string[])[] = [];

  // City filter
  if (city) {
    conditions.push(`LOWER(c.city) = LOWER($${queryParams.length + 1})`);
    queryParams.push(city);
  }

  // Macro-neighborhood filter
  if (macroNeighborhood) {
    conditions.push(`LOWER(n.macro_neighborhood) = LOWER($${queryParams.length + 1})`);
    queryParams.push(macroNeighborhood);
  }

  // Neighborhoods filter (multiple neighborhoods)
  if (neighborhoods && neighborhoods.length > 0) {
    conditions.push(`LOWER(n.neighborhood) = ANY($${queryParams.length + 1})`);
    queryParams.push(neighborhoods.map(n => n.toLowerCase()));
  }

  // Categories filter (multiple categories)
  if (categories && categories.length > 0) {
    // Check if any of the specified categories exist in the service's categories array
    const categoryConditions = categories.map((_, index) => 
      `$${queryParams.length + index + 1} = ANY(s.service_category)`
    );
    conditions.push(`(${categoryConditions.join(' OR ')})`);
    queryParams.push(...categories);
  }

  return {
    whereClause: conditions.join(' AND '),
    queryParams
  };
}


export { transporter, isDevelopmentMode, sendMail };