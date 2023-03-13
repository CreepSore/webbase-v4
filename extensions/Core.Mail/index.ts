import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";

import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

interface MailConfig {
    host: string,
    port: number,
    secure: boolean,
    username: string,
    password: string,
    rejectUnauthorizedTls: boolean
}

class CoreMailTemplate {
    alerts = {
        enabled: false,
        account: {
            host: "localhost",
            port: 25,
            username: "alertmail@localhost",
            password: "password",
            secure: true,
            rejectUnauthorizedTls: true,
        },
        // @ts-ignore
        recipients: [],
    };
}

export default class CoreMail implements IExtension {
    metadata: ExtensionMetadata = {
        name: "Core.Mail",
        version: "1.0.0",
        description: "Core Mail Module",
        author: "ehdes",
        dependencies: ["Core"],
    };

    config: CoreMailTemplate;
    configLoader: ConfigLoader<typeof this.config>;
    events: EventEmitter = new EventEmitter();
    transporters: Map<string, nodemailer.Transporter> = new Map();

    constructor() {
        this.config = this.loadConfig();
    }

    async start(executionContext: IExecutionContext) {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        const alertCfg = this.config.alerts;
        if(alertCfg.enabled) {
            this.addMailer("ALERT", alertCfg.account);
        }
    }

    async stop() {

    }

    addMailer(name: string, config: MailConfig) {
        const transporter = nodemailer.createTransport({
            host: config.host,
            auth: {
                user: config.username,
                pass: config.password,
            },
            port: config.port,
            secure: config.secure,
            tls: {
                rejectUnauthorized: config.rejectUnauthorizedTls === true ? true : false,
            },
        });
        this.transporters.set(name, transporter);

        console.log("INFO", "Core.Mail", `Added Mail-Transporter [${name}]@][${config.username}]`);

        return transporter;
    }

    getMailer(name: string) {
        return this.transporters.get(name);
    }

    async sendMail(mailerName: string, mail: Partial<Mail.Options>) {
        const mailer = this.getMailer(mailerName);
        if(!mailer) return false;
        const mailerOptions = mailer.options as SMTPTransport;
        mail.from = mail.from ?? mailerOptions.auth.user;

        console.log("INFO", "Core.Mail", `Sending mail to [${mail.to}] from [${mail.from}]`);
        try {
            await mailer.sendMail(mail);
            console.log("INFO", "Core.Mail", `Sent mail to [${mail.to}] from [${mail.from}]`);
        }
        catch(err) {
            console.log("ERROR", "Core.Mail", `Failed to send mail to [${mail.to}] from [${mail.from}]: ${err.message}`);
            return false;
        }

        return true;
    }

    async sendAlertMail(mail: Partial<Mail.Options>) {
        if(!this.config.alerts.enabled) return;

        for(const recipient of this.config.alerts.recipients) {
            mail.to = recipient;
            await this.sendMail("ALERT", mail);
        }
    }

    private checkConfig() {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.configLoader.configPath}]`);
        }
    }

    private loadConfig() {
        const model = new CoreMailTemplate();
        if(Object.keys(model).length === 0) return model;

        const [cfgname, templatename] = this.generateConfigNames();
        this.configLoader = new ConfigLoader(cfgname, templatename);
        const cfg = this.configLoader.createTemplateAndImport(model);

        return cfg;
    }

    private generateConfigNames() {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createConfigPath(`${this.metadata.name}.template.json`),
        ];
    }
}
