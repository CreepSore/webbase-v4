type LokiAuthentication = {
    enabled: boolean;
    username: string;
    password: string;
};

type LokiConfig = {
    endpoint: string;
    serviceName: string;
    authentication: LokiAuthentication;
}

type LokiLog = {
    date: Date;
    level: string;
    message: string;
    appendedJson?: string;
};

export type {
    LokiAuthentication,
    LokiConfig,
    LokiLog
};

export default class LokiClient {
    private config: LokiConfig;
    private toPush: Map<string, LokiLog[]> = new Map();
    private headers: any;

    constructor(config: LokiConfig) {
        this.config = config;

        this.headers = {
            "Content-Type": "application/json"
        };

        if(config.authentication.enabled) {
            const authString = Buffer.from(`${config.authentication.username}:${config.authentication.password}`).toString("base64");
            this.headers.Authorization = `Basic ${authString}`;
        }
    }

    async pushLog(log: LokiLog): Promise<void> {
        for(const [level, logs] of [...this.toPush.entries(), [log.level, [log]] as const]) {
            await fetch(`${this.config.endpoint}/loki/api/v1/push`, {
                body: JSON.stringify({
                    streams: [
                        {
                            stream: {
                                level: log.level,
                                service_name: this.config.serviceName,
                            },
                            values: logs.map(l => ([String(l.date.valueOf() * 1000 * 1000), log.message, log.appendedJson].filter(Boolean)))
                        }
                    ]
                }),
                method: "POST",
                headers: this.headers
            }).then((e) => {
                if(e.status === 204) {
                    this.toPush.delete(level);
                }
            }).catch((e) => {
                let existing = this.toPush.get(log.level);
                if(!Array.isArray(existing)) {
                    this.toPush.set(log.level, [log]);
                }
                else {
                    existing.push(log);
                }
            });
        }
    }
}
