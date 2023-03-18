interface RssItem {
    title: string;
    link: string;
    description: string;
    pubDate: Date;
    guid?: {
        text: string;
        isPermaLink?: boolean;
    };
}

export interface RssChannel {
    title: string;
    link: string;
    description: string;
    items: RssItem[];
}

export default class RssFeed {
    channels: RssChannel[] = [];

    constructor() {

    }

    addChannel(channel: RssChannel): boolean {
        if(this.channels.find(c => c.title === channel.title)) return false;

        this.channels.push(channel);
        return true;
    }

    addItem(channelTitle: string, item: RssItem): boolean {
        const channel = this.getChannel(channelTitle);
        if(!channel) {
            return false;
        }

        channel.items.push(item);
        return true;
    }

    getChannel(channelTitle: string): RssChannel {
        return this.channels.find(c => c.title === channelTitle);
    }

    toRssString(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    ${this.channels.map(c => this.generateChannelString(c)).join("\n")}
</rss>`;
    }

    private generateChannelString(channel: RssChannel): string {
        return `<channel>
    <title>${channel.title}</title>
    <link>${channel.link}</link>
    <description>${channel.description}</description>
    ${channel.items.map(i => this.generateItemString(i)).join("\n")}
</channel>`;
    }

    private generateItemString(item: RssItem): string {
        return `<item>
    <title>${item.title}</title>
    <link>${item.link}</link>
    <description>${item.description}</description>
    <pubDate>${item.pubDate.toUTCString()}</pubDate>
    ${item.guid ? `<guid isPermaLink="${item.guid.isPermaLink ?? false}">${item.guid.text}</guid>` : ""}
</item>`;
    }
}
