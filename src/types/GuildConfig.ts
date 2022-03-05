import { Snowflake } from 'discord.js';

export enum Actions {
    Timeout = 'timeout',
    Ban = 'ban',
    GiveRole = 'role',
    NotifyChannel = 'channel',
    NotifyThread = 'thread',
}

export const choices: Actions[] = [
    Actions.Timeout,
    Actions.Ban,
    Actions.GiveRole,
    Actions.NotifyChannel,
    Actions.NotifyThread,
];

export type TimeoutOptions = '1 minute' | '5 minutes' | '10 minutes' | '1 hour' | '1 day' | '1 week';

export const timeoutOptionMap: Record<TimeoutOptions, number> = {
    '1 minute': 1000 * 60,
    '5 minutes': 1000 * 60 * 5,
    '10 minutes': 1000 * 60 * 10,
    '1 hour': 1000 * 60 * 60,
    '1 day': 1000 * 60 * 60 * 24,
    '1 week': 1000 * 60 * 60 * 24 * 7,
};

export default interface GuildConfig {
    adminRole?: Snowflake;
    joinActions?: {
        [Actions.Timeout]?: TimeoutOptions;

        /** The reason for the ban. */
        [Actions.Ban]?: string;
        /** Role id to give. */
        [Actions.GiveRole]?: Snowflake;
        /** Channel id to send message in. */
        [Actions.NotifyChannel]?: Snowflake;
        /** Channel id to make thread from. */
        [Actions.NotifyThread]?: Snowflake;
    };
}
