import nodemailer from "nodemailer";

// Create a test account or replace with real credentials.
// const transporter = nodemailer.createTransport({
//     name: "ethereal.com",
//     host: "smtp.ethereal.email",
//     port: 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//         user: "cydney4@ethereal.email",
//         pass: "44F6zjvpp4SssCD2dD",
//     },
// });

const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
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
});

const sendMail = async (emailSubject: string, emailText: string, emailHtml: string, email?: string ) => {
    const from = isDevelopmentMode() ? '"The Local Board" <no-reply@example.com>'
        : `"The Local Board Support" <noreply@keepitlocal.com>`;
    const to = isDevelopmentMode() ? "receiver@example.com" : email;

    try {
        const info = await transporter.sendMail({
            from,
            to,
            replyTo: "support@keepitlocal.com",
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

const isDevelopmentMode = () => {
    if (process.env.NODE_ENV == 'development') {
        return true;
    }
    return false;
}


// Name: Cydney Zieme
export { transporter, isDevelopmentMode, sendMail };