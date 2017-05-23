const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');  // used to inline css
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

// create a transport
const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// function to send email
exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  // get the text version
  const text = htmlToText.fromString(html);

  const mailOptions = {
    from: `Diana Fisher <noreply@diana-fisher.com`,
    to: options.user.email,
    subject: options.subject,
    html: html,
    text: text
  };

  // promisify our send mail function and bind it to transport
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  // console.log(html);
  // inline the css
  const inlined = juice(html);
  return inlined;
};
