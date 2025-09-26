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
        pass: "=%U<r$>i'q)aK30yr#%>",
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


// Name: Cydney Zieme
export { transporter, isDevelopmentMode, sendMail };