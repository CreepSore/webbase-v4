import {EventEmitter} from "events";

import IExecutionContext from "@service/extensions/IExecutionContext";
import IExtension, { ExtensionMetadata } from "@service/extensions/IExtension";
import ConfigLoader from "@logic/config/ConfigLoader";

import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import LogBuilder from "@service/logger/LogBuilder";
import Core from "@extensions/Core";

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
    static metadata: ExtensionMetadata = {
        name: "Core.Mail",
        version: "1.0.0",
        description: "Core Mail Module",
        author: "ehdes",
        dependencies: [Core],
    };

    metadata: ExtensionMetadata = CoreMail.metadata;

    config: CoreMailTemplate;
    events: EventEmitter = new EventEmitter();
    transporters: Map<string, nodemailer.Transporter> = new Map();

    constructor() {
        this.config = this.loadConfig(true);
    }

    async start(executionContext: IExecutionContext): Promise<void> {
        this.checkConfig();
        if(executionContext.contextType === "cli") {
            return;
        }

        const alertCfg = this.config.alerts;
        if(alertCfg.enabled) {
            this.addMailer("ALERT", alertCfg.account);
        }
    }

    async stop(): Promise<void> {

    }

    addMailer(name: string, config: MailConfig): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
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

        LogBuilder
            .start()
            .level("INFO")
            .info("Core.Mail")
            .line(`Added Mail-Transporter [${name}]@][${config.username}]`)
            .done();

        return transporter;
    }

    getMailer(name: string): nodemailer.Transporter<any> {
        return this.transporters.get(name);
    }

    async sendMail(mailerName: string, mail: Partial<Mail.Options>): Promise<boolean> {
        const mailer = this.getMailer(mailerName);
        if(!mailer) {
            LogBuilder
                .start()
                .level("WARN")
                .info("Core.Mail")
                .line(`Mailer with name [${mailerName}] does not exist`)
                .done();

            return false;
        }

        const mailerOptions = mailer.options as SMTPTransport;
        mail.from = mail.from ?? mailerOptions.auth.user;

        LogBuilder
            .start()
            .level("INFO")
            .info("Core.Mail")
            .line(`Sending mail to [${mail.to}] from [${mail.from}]`)
            .done();

        try {
            await mailer.sendMail(mail);

            LogBuilder
                .start()
                .level("INFO")
                .info("Core.Mail")
                .line(`Sent mail to [${mail.to}] from [${mail.from}]`)
                .done();
        }
        catch(err) {
            LogBuilder
                .start()
                .level("INFO")
                .info("Core.Mail")
                .line(`Failed to send mail to [${mail.to}] from [${mail.from}]: ${err.message}`)
                .debugObject("error", err)
                .done();

            return false;
        }

        return true;
    }

    async sendAlertMail(mail: Partial<Mail.Options>): Promise<void> {
        if(!this.config.alerts.enabled) return;

        for(const recipient of this.config.alerts.recipients) {
            mail.to = recipient;
            await this.sendMail("ALERT", mail);
        }
    }

    private checkConfig(): void {
        if(!this.config) {
            throw new Error(`Config could not be found at [${this.generateConfigNames()[0]}]`);
        }
    }

    private loadConfig(createDefault: boolean = false): typeof this.config {
        const [configPath, templatePath] = this.generateConfigNames();
        return ConfigLoader.initConfigWithModel(
            configPath,
            templatePath,
            new CoreMailTemplate(),
            createDefault,
        );
    }

    private generateConfigNames(): string[] {
        return [
            ConfigLoader.createConfigPath(`${this.metadata.name}.json`),
            ConfigLoader.createTemplateConfigPath(`${this.metadata.name}.json`),
        ];
    }
}
