import { Snowflake } from 'discord.js';

/** @example '3/1/2021 15:28:38' */
type TimeCell = string;

/** @example 'AFakeUser#1234' */
type DiscordTag = string;

export default interface Banlist {
    /** @example 'Sheet1!A1:D1000' */
    range: string;

    majorDimension: 'ROWS';

    values: [timestamp: TimeCell, discordTag: DiscordTag, discordId: Snowflake, reason: string][];
}
