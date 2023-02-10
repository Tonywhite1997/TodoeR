const nodeMailer = require("nodemailer");
const pug = require("pug");
const { convert } = require("html-to-text");

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Tony Oluwole <${process.env.EMAIL_USERNAME}>`;
  }
  createTransporter() {
    if (process.env.NODE_ENV === "production") {
      //sendGrid
      return 1;
    } else {
      return nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
  }
  async send(template, subject) {
    //The HTML file location in the view route
    const html = pug.renderFile(`${__dirname}/..view/email/${template}.pug`, {
      url: this.url,
      name: this.firstName,
      subject,
    });
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };
    await this.createTransporter().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the family");
  }
}

module.exports = Email;
