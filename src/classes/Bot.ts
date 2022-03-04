import { RESTPostAPIApplicationCommandsJSONBody as RawCommand, Snowflake } from 'discord-api-types';
import { Client, Collection, CommandInteraction, Intents, Interaction } from 'discord.js';
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
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
        });

        this.sheetManager = new SheetManager(auth.googleSheetsApiKey, auth.googleSheetId, this._logger);

        this.start();

        this.sheetManager.on('userAdded', (user) => {
            console.log(`New user: ${user.username}`);
        });
        this.sheetManager.on('userRemoved', (user) => {
            console.log(`User removed: ${user.username}`);
        });
    }

    /** Attempts to log the client in, existing the process if unable to do so. */
    private async start(): Promise<void> {
        // this is not done in the constructor since logging in is an asynchronous task
        this.client.once('ready', () => this.onReady());
        this.client.on('error', (err) => this._logger.log(err));
        this.client.on('interactionCreate', (int) => this.onInteractionCreate(int));

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

    public getEntry(id: Snowflake): Entry | undefined {
        return this.sheetManager.entries[id];
    }
}
