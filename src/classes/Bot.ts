import { RESTPostAPIApplicationCommandsJSONBody as RawCommand, Snowflake } from 'discord-api-types';
import {
    Client,
    Collection,
    CommandInteraction,
    Guild,
    GuildMember,
    GuildTextBasedChannel,
    Intents,
    Interaction,
    MessageEmbed,
} from 'discord.js';
import { Routes } from 'discord-api-types/v9';
import { config } from '../config';
import getVersion from '../helpers/getVersion';
import Auth from '../types/Auth';
import Colours from '../types/Colours';
import commands from '../commands';
import { Command } from '../types/Command';
import Logger from './Logger';
import { REST } from '@discordjs/rest';
import { Entry, SheetManager } from './SheetManager';
import GuildConfigManager from './GuildConfigManager';
import moment from 'moment';
import { Actions, timeoutOptionMap } from '../types/GuildConfig';
import { userMention } from '@discordjs/builders';

export class Bot {
    public readonly client: Client<true>;
    public readonly devMode: boolean;
    public readonly version: string = getVersion();
    public readonly sheetManager: SheetManager;
    public readonly configManager: GuildConfigManager = new GuildConfigManager();

    private readonly _auth: Auth;
    private readonly _logger: Logger = new Logger('main', this.version);
    private readonly _startTime: number = Date.now();
    private readonly _commands: Collection<string, Command> = new Collection();

    public constructor(auth: Auth, devmode: boolean) {
        this._auth = auth;
        this.devMode = devmode;

        this.client = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
        });

        this.sheetManager = new SheetManager(auth.googleSheetsApiKey, auth.googleSheetId, this._logger);

        this.start();

        this.sheetManager.on('userAdded', (user) => this.onListAdd(user));
        this.sheetManager.on('userRemoved', (user) => this.onListRemove(user));
    }

    /** Attempts to log the client in, existing the process if unable to do so. */
    private async start(): Promise<void> {
        // this is not done in the constructor since logging in is an asynchronous task
        this.client.once('ready', () => this.onReady());
        this.client.on('error', (err) => this._logger.log(err));
        this.client.on('interactionCreate', (int) => this.onInteractionCreate(int));
        this.client.on('guildMemberAdd', (member) => this.onJoin(member));

        const timeout = config.timeoutThresholds.login
            ? setTimeout(() => {
                  console.log(`Took too long to login (max ${config.timeoutThresholds.login}s)`);
                  process.exit(1);
              }, config.timeoutThresholds.login * 1000)
            : null;

        try {
            await this.client.login(this._auth.discordToken);
            if (timeout) clearTimeout(timeout);
        } catch (error) {
            if (error instanceof Error && error.message === 'TOKEN_INVALID') {
                console.log(`invalid token in ${Colours.FgMagenta}auth.json${Colours.Reset} file`);
            } else console.log(error);
            process.exit(1);
        }
    }

    /** Runs once the client is ready. */
    private async onReady() {
        console.log(
            `${this.client.user.tag} logged in (${Colours.FgMagenta}${(Date.now() - this._startTime) / 1000}s${
                Colours.Reset
            })`,
        );

        this.client.user.setActivity('👀', { type: 'WATCHING' });

        const commandsToDeploy: RawCommand[] = [];
        console.log(
            `Deploying ${commands.length} Command${commands.length !== 1 ? 's' : ''} ${
                this.devMode ? 'Locally' : 'Globally'
            }`,
        );

        for (const command of commands) {
            this._commands.set(command.name, command);
            commandsToDeploy.push(command.build().toJSON());
        }

        if (this.devMode) await this.guildDeploy(commandsToDeploy);
        else await this.globalDeploy(commandsToDeploy);
    }

    private async guildDeploy(body: RawCommand[]) {
        const allGuilds = await this.client.guilds.fetch();

        const api = new REST({ version: '9' }).setToken(this._auth.discordToken);

        for (const [guildId] of allGuilds) {
            const guild = await allGuilds.get(guildId)?.fetch();
            if (!guild) continue;

            try {
                await api.put(Routes.applicationGuildCommands(this.client.user.id, guildId), { body });
                console.log(`Deployed slash commands to ${Colours.FgMagenta}${guild.name}${Colours.Reset}`);
            } catch (error) {
                console.log(`Error deploying to ${Colours.FgMagenta}${guild.name}${Colours.Reset}`);
                console.log(error);
            }

            // clear global commands to avoid duplicates
            this.globalDeploy([]);
        }
    }

    private async globalDeploy(body: RawCommand[]) {
        const api = new REST({ version: '9' }).setToken(this._auth.discordToken);

        try {
            await api.put(Routes.applicationCommands(this.client.user.id), { body });
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    private canUseCommand(interaction: CommandInteraction<'present'>): boolean {
        if (interaction.memberPermissions.has('ADMINISTRATOR')) return true;
        const allowedRoleId = this.configManager.getGuildConfig(interaction.guildId).adminRole;
        if (!allowedRoleId) return false;

        if (Array.isArray(interaction.member.roles)) {
            return interaction.member.roles.includes(allowedRoleId);
        } else return interaction.member.roles.cache.has(allowedRoleId);
    }

    private async onInteractionCreate(interaction: Interaction): Promise<void> {
        if (!interaction.isCommand()) return;

        const command = this._commands.get(interaction.commandName);
        if (!command) {
            return await interaction.reply({ content: `I don't have a command called ${interaction.commandName}` });
        }

        if (!interaction.inGuild()) {
            return await interaction.reply({
                content: 'You need to be in a server to use my commands',
                ephemeral: true,
            });
        }

        if (!this.canUseCommand(interaction)) {
            return await interaction.reply({ content: 'You are not allowed to use this command', ephemeral: true });
        }

        try {
            await command.execute({ interaction, bot: this });
        } catch (error) {
            this._logger.log(`Error executing the ${interaction.commandName} command for ${interaction.user.username}`);
            this._logger.log(error);
        }
    }

    // eslint-disable-next-line require-await
    private async onJoin(member: GuildMember): Promise<void> {
        const entry = this.sheetManager.entries[member.id] as Entry | undefined;
        if (!entry) return;

        const guildConfig = this.configManager.getGuildConfig(member.guild.id);
        if (!guildConfig.joinActions) return;

        const banReason = guildConfig.joinActions[Actions.Ban];
        if (banReason) {
            try {
                await member.ban({ reason: banReason, days: 1 });
            } catch (error) {
                this._logger.log(
                    `Error banning ${member.user.username} (${member.id}) from ${member.guild.name} (${member.guild.id})`,
                );
                this._logger.log(error);
            }
            return;
        }

        const notifyChannel = guildConfig.joinActions[Actions.NotifyChannel];
        if (notifyChannel) {
            const channel = await this.client.channels.fetch(notifyChannel);
            if (channel?.type === 'GUILD_TEXT') {
                try {
                    const content: string[] = [
                        `❗ ${member.user.username} just joined the server`,
                        `In global banlist since ${new Date(entry.timestamp).toLocaleDateString('en-NZ')} (${moment(
                            entry.timestamp,
                        ).fromNow()})`,
                        `Reason: ${entry.reason}`,
                    ];

                    await channel.send({ content: content.join('\n') });
                } catch (error) {
                    this._logger.log(
                        `Error sending message about ${member.user.username} (${member.id}) to channel ${
                            channel?.name || notifyChannel
                        } in server ${member.guild.name} (${member.guild.id})`,
                    );
                    this._logger.log(error);
                }
            }
        }

        const threadChannel = guildConfig.joinActions[Actions.NotifyThread];
        if (threadChannel) {
            const channel = await this.client.channels.fetch(threadChannel);
            if (channel?.type === 'GUILD_TEXT') {
                try {
                    const thread = await channel.threads.create({
                        name: member.user.username,
                        reason: 'Global blacklist alerting',
                    });
                    const content: string[] = [
                        `❗ ${member.user.username} just joined the server`,
                        `In global banlist since ${new Date(entry.timestamp).toLocaleDateString('en-NZ')} (${moment(
                            entry.timestamp,
                        ).fromNow()})`,
                        `Reason: ${entry.reason}`,
                    ];

                    await thread.send({ content: content.join('\n') });
                } catch (error) {
                    this._logger.log(
                        `Error making thread for ${member.user.username} (${member.id}) under channel ${
                            channel?.name || threadChannel
                        } in server ${member.guild.name} (${member.guild.id})`,
                    );
                    this._logger.log(error);
                }
            }
        }

        const roleId = guildConfig.joinActions[Actions.GiveRole];
        if (roleId) {
            const role = await member.guild.roles.fetch(roleId);
            if (role) {
                try {
                    await member.roles.add(role);
                } catch (error) {
                    this._logger.log(
                        `Error giving ${role.name} role to ${member.user.username} (${member.id}) in server ${member.guild.name} (${member.guild.id})`,
                    );
                    this._logger.log(error);
                }
            }
        }

        const timeoutTime = guildConfig.joinActions[Actions.Timeout];
        if (timeoutTime) {
            const duration = timeoutOptionMap[timeoutTime];
            try {
                await member.timeout(duration, 'Global blacklist timeout');
            } catch (error) {
                this._logger.log(
                    `Error timing out ${member.user.username} (${member.id}) for ${duration}ms in server ${member.guild.name} (${member.guild.id})`,
                );
                this._logger.log(error);
            }
        }
    }

    public getEntry(id: Snowflake): Entry | undefined {
        return this.sheetManager.entries[id];
    }

    private makeListEventEmbed(
        entry: Entry,
        guild: Guild,
        member: GuildMember,
        eventType: 'added' | 'removed',
    ): MessageEmbed {
        const description: string[] = [];

        if (eventType === 'added') {
            description.push(
                `${userMention(member.id)} was added to the blacklist ${moment(entry.timestamp).fromNow()}.`,
            );
        } else {
            description.push(
                `${userMention(member.id)} was removed from the blacklist after ${moment(entry.timestamp).fromNow(
                    true,
                )}`,
            );
        }

        const joinedAt = member.joinedAt;
        if (!joinedAt) {
            description.push('⚠️ User has been in this server for an unknown amount of time.');
        } else {
            description.push(
                `⚠️ User has been in this server for **${moment(joinedAt).fromNow(true)}**`,
                `*Joined ${new Date(joinedAt).toLocaleDateString('en-NZ')}*`,
            );
        }

        const embed = new MessageEmbed()
            .setTitle(eventType === 'added' ? 'Added to Blacklist' : 'Removed From Blacklist')
            .setDescription(description.join('\n'))
            .addField('Reason', entry.reason || 'No reason specified.')
            .addField('Listed', new Date(entry.timestamp).toLocaleString('en-NZ'))
            .setThumbnail(member.displayAvatarURL() ?? '');

        return embed;
    }

    /** Runs when a user is added to the global banlist. */
    private async onListAdd(entry: Entry): Promise<void> {
        for (const guildId in this.configManager.data) {
            const guildConfig = this.configManager.getGuildConfig(guildId);
            if (!guildConfig.notificationsChannel) continue;

            try {
                const channelPromise = this.client.channels.fetch(
                    guildConfig.notificationsChannel,
                ) as Promise<GuildTextBasedChannel | null>;

                const guildPromise = this.client.guilds.fetch(guildId);

                const [guild, channel] = await Promise.all([guildPromise, channelPromise]);
                if (!channel) continue;

                let member: GuildMember;
                try {
                    member = await guild.members.fetch(entry.id);
                } catch (error) {
                    // user not in this guild = dont bother sending notification
                    continue;
                }

                const embed = this.makeListEventEmbed(entry, guild, member, 'added');

                await channel.send({ embeds: [embed] });
            } catch (error) {
                this._logger.log(`Error sending list add notification to guild ${guildId}`);
                this._logger.log(error);
            }
        }
    }

    /** Runs when a user is removed from the global banlist. */
    private async onListRemove(entry: Entry): Promise<void> {
        for (const guildId in this.configManager.data) {
            const guildConfig = this.configManager.getGuildConfig(guildId);
            if (!guildConfig.notificationsChannel) continue;

            try {
                const channelPromise = this.client.channels.fetch(
                    guildConfig.notificationsChannel,
                ) as Promise<GuildTextBasedChannel | null>;

                const guildPromise = this.client.guilds.fetch(guildId);

                const [guild, channel] = await Promise.all([guildPromise, channelPromise]);
                if (!channel) continue;

                let member: GuildMember;
                try {
                    member = await guild.members.fetch(entry.id);
                } catch (error) {
                    // user not in this guild = dont bother sending notification
                    continue;
                }

                const embed = this.makeListEventEmbed(entry, guild, member, 'removed');

                await channel.send({ embeds: [embed] });
            } catch (error) {
                this._logger.log(`Error sending list remove notification to guild ${guildId}`);
                this._logger.log(error);
            }
        }
    }
}
