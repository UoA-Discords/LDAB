import { channelMention, SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandParams } from '../../types/Command';
import { ChannelType } from 'discord-api-types';
import { GuildTextBasedChannel } from 'discord.js';

class Notifications implements Command {
    public name = 'notifications';
    public description = 'Manage how notifications are sent.';
    public build(): SlashCommandBuilder {
        const command = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

        command.addSubcommand((sub) =>
            sub
                .setName('set')
                .setDescription('Set the channel to send notifications to')
                .addChannelOption((option) =>
                    option
                        .addChannelType(ChannelType.GuildText)
                        .setName('channel')
                        .setDescription('The channel to send to')
                        .setRequired(true),
                ),
        );

        command.addSubcommand((sub) => sub.setName('get').setDescription('Get the designated notifications channel'));
        command.addSubcommand((sub) => sub.setName('clear').setDescription('Stop sending notifications'));

        return command;
    }

    public async execute({ interaction, bot }: CommandParams): Promise<void> {
        if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ content: 'You need to be an admin to use this command', ephemeral: true });
        }
        const action = interaction.options.getSubcommand() as 'set' | 'get' | 'clear';
        const config = bot.configManager.getGuildConfig(interaction.guildId);

        switch (action) {
            case 'clear': {
                const existingId = config.notificationsChannel;
                if (!existingId) {
                    await interaction.reply({ content: 'No notifications channel to clear', ephemeral: true });
                } else {
                    delete config.notificationsChannel;
                    bot.configManager.updateGuildConfig(interaction.guildId, config);
                    await interaction.reply({
                        content: `No longer sending notifications to ${channelMention(existingId)}`,
                    });
                }
                return;
            }
            case 'get': {
                const existingId = config.notificationsChannel;
                if (!existingId) {
                    await interaction.reply({
                        content: "There isn't currently a notifications channel",
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: `The current notifications channel is ${channelMention(existingId)}`,
                    });
                }
                return;
            }
            case 'set': {
                const newChannel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;
                const previousId = config.notificationsChannel;
                config.notificationsChannel = newChannel.id;
                bot.configManager.updateGuildConfig(interaction.guildId, config);
                if (previousId) {
                    await interaction.reply({
                        content: `Changed the notifications channel from ${channelMention(
                            previousId,
                        )} to ${channelMention(newChannel.id)}`,
                    });
                } else {
                    await interaction.reply({
                        content: `Set the notifications channel to ${channelMention(newChannel.id)}`,
                    });
                }
                return;
            }
        }
    }
}

export default new Notifications();
