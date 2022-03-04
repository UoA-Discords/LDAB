import { SlashCommandBuilder } from '@discordjs/builders';
import moment from 'moment';
import { Command, CommandParams } from '../types/Command';

export class Query extends Command {
    public name = 'query';
    public description = 'Check a user.';
    public build(): SlashCommandBuilder {
        const command = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

        command.addUserOption((option) => option.setName('user').setDescription('The user to query').setRequired(true));

        return command;
    }

    public async execute({ interaction, bot }: CommandParams): Promise<void> {
        const user = interaction.options.getUser('user', true);

        const entry = bot.getEntry(user.id);

        const response: string[] = [];

        if (entry) {
            response.push(
                `❗ ${user.username} is **in** the global banlist.`,
                `Since: ${new Date(entry.timestamp).toLocaleDateString('en-NZ')} (${moment(
                    entry.timestamp,
                ).fromNow()})`,
                `Reason: ${entry.reason}`,
            );
        } else response.push(`✅ ${user.username} is **not in** the global banlist.`);

        await interaction.reply({ content: response.join('\n') });
    }
}

export default new Query();
