import { SlashCommandBuilder } from '@discordjs/builders';
import { Command, CommandParams } from '../../types/Command';

class AdminRole implements Command {
    public name = 'adminrole';
    public description = 'Manage the role that can use my commands.';
    public build(): SlashCommandBuilder {
        const command = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('set')
                .setDescription('Set the role that can use my commands')
                .addRoleOption((option) => option.setName('role').setDescription('The role to use').setRequired(true)),
        );

        command.addSubcommand((subcommand) =>
            subcommand.setName('get').setDescription('Get the role that can use my commands'),
        );

        command.addSubcommand((subcommand) =>
            subcommand.setName('clear').setDescription('Make no role able to use my commands'),
        );

        return command;
    }

    public async execute({ interaction, bot }: CommandParams): Promise<void> {
        if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
            return await interaction.reply({ content: 'You need to be an admin to use this command', ephemeral: true });
        }

        const action = interaction.options.getSubcommand() as 'set' | 'get' | 'clear';

        const guildConfig = bot.configManager.getGuildConfig(interaction.guildId);
        const configuredRoleId = guildConfig.adminRole;
        const configuredRole = configuredRoleId ? await interaction.guild?.roles.fetch(configuredRoleId) : undefined;

        switch (action) {
            case 'clear':
                if (configuredRole) {
                    delete guildConfig.adminRole;
                    bot.configManager.updateGuildConfig(interaction.guildId, { ...guildConfig });
                    await interaction.reply({
                        content: `**${configuredRole.name}** is no longer the designated admin role`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({ content: 'No configured role to clear', ephemeral: true });
                }
                return;
            case 'get':
                if (configuredRole) {
                    await interaction.reply({
                        content: `**${configuredRole.name}** is the designated admin role`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({ content: 'No designated admin role', ephemeral: true });
                }
                return;
            case 'set': {
                const option = interaction.options.getRole('role', true);
                if (option.id === guildConfig.adminRole) {
                    await interaction.reply({
                        content: `**${option.name}** is already the designated admin role`,
                        ephemeral: true,
                    });
                    return;
                }
                bot.configManager.updateGuildConfig(interaction.guildId, { ...guildConfig, adminRole: option.id });
                await interaction.reply({
                    content: `Changed the designated admin role to **${option.name}**`,
                    ephemeral: true,
                });
                return;
            }
        }
    }
}

export default new AdminRole();
