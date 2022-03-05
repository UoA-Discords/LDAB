import { channelMention, SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types';
import { GuildTextBasedChannel, Role } from 'discord.js';
import { Command, CommandParams } from '../../types/Command';
import { Actions, choices, timeoutOptionMap, TimeoutOptions } from '../../types/GuildConfig';

class Action implements Command {
    public name = 'actions';
    public description = 'Configure actions to take on join.';

    public build(): SlashCommandBuilder {
        const command = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

        command.addSubcommandGroup((group) => {
            const timeoutChoices: [name: string, value: string][] = Object.keys(timeoutOptionMap).map((key) => [
                key,
                key,
            ]);

            group
                .setName('set')
                .setDescription('Set the actions to take when a blacklisted member joins')

                // timeout
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName(Actions.Timeout)
                        .setDescription('Time out blacklisted members')
                        .addStringOption((option) =>
                            option
                                .setName('duration')
                                .setDescription('How long they should be timed out for')
                                .setChoices(timeoutChoices)
                                .setRequired(true),
                        ),
                )

                // ban
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName(Actions.Ban)
                        .setDescription('Ban blacklisted members')
                        .addStringOption((option) =>
                            option.setName('reason').setDescription('Reason for ban').setRequired(true),
                        ),
                )

                // role
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName(Actions.GiveRole)
                        .setDescription('Give a role to blacklisted members')
                        .addRoleOption((option) =>
                            option.setName('role').setDescription('The role to give').setRequired(true),
                        ),
                )

                // notify
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName(Actions.NotifyChannel)
                        .setDescription('Send a message when a blacklisted member joins')
                        .addChannelOption((option) =>
                            option
                                .addChannelType(ChannelType.GuildText)
                                .setName('channel')
                                .setDescription('The channel to send to')
                                .setRequired(true),
                        ),
                )

                // thread
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName(Actions.NotifyThread)
                        .setDescription('Make a thread when a blacklisted members joins')
                        .addChannelOption((option) =>
                            option
                                .addChannelType(ChannelType.GuildText)
                                .setName('channel')
                                .setDescription('The channel to make the thread under')
                                .setRequired(true),
                        ),
                );
            return group;
        });

        command.addSubcommand((subcommand) =>
            subcommand.setName('get').setDescription('Get the actions taken when a blacklisted member joins'),
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('clear')
                .setDescription('Clear the actions taken when a blacklisted member joins')
                .addStringOption((option) => {
                    option.setName('action').setDescription('the specific action to clear');

                    const options: [name: string, value: string][] = choices.map((e) => [e, e]);

                    option.setChoices(options);

                    return option;
                }),
        );

        return command;
    }

    public async execute(params: CommandParams): Promise<void> {
        const { interaction } = params;

        if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ content: 'You need to be an admin to use this command', ephemeral: true });
        }

        const action = interaction.options.getSubcommand(false) as Actions | 'get' | 'clear';
        const isSetting = !!(interaction.options.getSubcommandGroup(false) as 'set' | null);

        switch (action) {
            case 'get':
                await this.handleGet(params);
                return;
            case 'clear':
                await this.handleClear(params);
                return;
        }

        if (isSetting) {
            await this.handleSet(params, action);
        } else {
            await interaction.reply({
                content: `Error occurred, action \`${action}\` should not be callable outside of \`set\` subcommand`,
                ephemeral: true,
            });
        }
    }

    private async handleGet({ bot, interaction }: CommandParams): Promise<void> {
        const joinActions = bot.configManager.getGuildConfig(interaction.guildId).joinActions;
        const response: string[] = [];

        const timeoutDuration = joinActions?.[Actions.Timeout];
        if (timeoutDuration) {
            response.push(`-Time out for ${timeoutDuration}`);
        }

        const banReason = joinActions?.[Actions.Ban];
        if (banReason) {
            response.push(`-Ban with reason: ${banReason}`);
        }

        const roleGiven = joinActions?.[Actions.GiveRole];
        if (roleGiven) {
            const role = await interaction.guild?.roles.fetch(roleGiven);
            if (role) {
                response.push(`-Give **${role.name}** role`);
            }
        }

        const channelNotified = joinActions?.[Actions.NotifyChannel];
        if (channelNotified) {
            const channel = await interaction.guild?.channels.fetch(channelNotified);
            if (channel) {
                response.push(`-Send message in ${channelMention(channel.id)}`);
            }
        }

        const threadParent = joinActions?.[Actions.NotifyThread];
        if (threadParent) {
            const channel = await interaction.guild?.channels.fetch(threadParent);
            if (channel) {
                response.push(`-Make thread in ${channelMention(channel.id)}`);
            }
        }

        if (response.length === 0) {
            response.push('Currently no actions are being taken when a blacklisted user joins');
        } else {
            response.splice(0, 0, 'The following actions are being taken when a blacklisted user joins:');
        }

        await interaction.reply({ content: response.join('\n') });
    }

    private async handleClear({ interaction, bot }: CommandParams) {
        const specificItem = interaction.options.getString('action', false) as Actions | null;
        const existingConfig = bot.configManager.getGuildConfig(interaction.guildId);

        if (!existingConfig.joinActions) {
            await interaction.reply({ content: 'No actions to delete', ephemeral: true });
            return;
        }

        if (!specificItem) {
            bot.configManager.clearGuildConfig(interaction.guildId);
            await interaction.reply({ content: 'Deleted all actions' });
            return;
        }

        const previousValue = existingConfig.joinActions?.[specificItem];
        if (!previousValue) {
            return await interaction.reply({
                content: `A ${specificItem} action isn't currently configured`,
                ephemeral: true,
            });
        }

        delete existingConfig.joinActions[specificItem];
        bot.configManager.updateGuildConfig(interaction.guildId, existingConfig);

        await interaction.reply({ content: `Deleted ${specificItem} action` });
    }

    private async handleSet({ interaction, bot }: CommandParams, action: Actions) {
        console.log(`handle set ${action}`);
        const existingConfig = bot.configManager.getGuildConfig(interaction.guildId);
        if (!existingConfig.joinActions) existingConfig.joinActions = {};

        let previousValue: string | undefined;
        let newValue: string | undefined;
        let valueDesc: string;

        switch (action) {
            case Actions.Timeout: {
                const newTimeout = interaction.options.getString('duration', true) as TimeoutOptions;
                previousValue = existingConfig.joinActions[Actions.Timeout];
                valueDesc = 'time out duration';
                newValue = newTimeout;
                existingConfig.joinActions[Actions.Timeout] = newTimeout;
                break;
            }
            case Actions.Ban: {
                const newReason = interaction.options.getString('reason', true);
                previousValue = existingConfig.joinActions[Actions.Ban];
                valueDesc = 'ban reason';
                newValue = newReason;
                existingConfig.joinActions[Actions.Ban] = newReason;
                break;
            }
            case Actions.GiveRole: {
                const newRole = interaction.options.getRole('role', true);
                if (newRole instanceof Role) {
                    if (!newRole.editable) {
                        await interaction.reply({
                            content:
                                "I don't have permission to give people this role (make sure I have a role higher than it)",
                            ephemeral: true,
                        });
                        return;
                    }
                } else {
                    await interaction.reply({ content: 'Invalid role', ephemeral: true });
                    return;
                }

                const prevRoleId = existingConfig.joinActions[Actions.GiveRole];
                if (prevRoleId) {
                    const prevRole = await interaction.guild?.roles.fetch(prevRoleId);
                    if (prevRole) previousValue = `**${prevRole.name}**`;
                }
                newValue = `**${newRole.name}**`;
                valueDesc = 'given role';
                existingConfig.joinActions[Actions.GiveRole] = newRole.id;
                break;
            }
            case Actions.NotifyChannel: {
                const newChannel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;
                const prevChannelId = existingConfig.joinActions[Actions.NotifyChannel];
                if (prevChannelId) previousValue = `${channelMention(prevChannelId)}`;
                newValue = `${channelMention(newChannel.id)}`;
                valueDesc = 'alerts channel';
                existingConfig.joinActions[Actions.NotifyChannel] = newChannel.id;
                break;
            }
            case Actions.NotifyThread: {
                const newChannel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;
                const prevChannelId = existingConfig.joinActions[Actions.NotifyThread];
                if (prevChannelId) previousValue = `${channelMention(prevChannelId)}`;
                newValue = `${channelMention(newChannel.id)}`;
                valueDesc = 'channel for threads';
                existingConfig.joinActions[Actions.NotifyThread] = newChannel.id;
                break;
            }
        }

        bot.configManager.updateGuildConfig(interaction.guildId, existingConfig);

        if (!previousValue) {
            await interaction.reply({ content: `Set ${valueDesc} to ${newValue}` });
        } else {
            await interaction.reply({ content: `Updated ${valueDesc} from ${previousValue} to ${newValue}` });
        }
    }
}

export default new Action();
