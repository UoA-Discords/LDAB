import { SlashCommandBuilder } from '@discordjs/builders';
import moment from 'moment';
import { Command, CommandParams } from '../../types/Command';

export class Ping extends Command {
    public name = 'ping';
    public description = 'Ping the bot.';
    public build(): SlashCommandBuilder {
        const command = new SlashCommandBuilder().setName(this.name).setDescription(this.description);

        command.addBooleanOption((option) => option.setName('hidden').setDescription('Show results to everyone'));

        return command;
    }

    private static pingHint(ping: number): string {
        if (ping < 500) return 'good';
        if (ping < 1000) return 'ok';
        if (ping < 2000) return 'bad';
        if (ping < 3000) return 'very bad';
        return 'oh god';
    }

    public async execute({ interaction, bot }: CommandParams): Promise<void> {
        const ping = Math.abs(Date.now() - interaction.createdTimestamp);
        const apiLatency = Math.round(bot.client.ws.ping);

        const ephemeral = interaction.options.getBoolean('hidden', false) ?? true;

        const uptime = moment(bot.client.readyAt).fromNow(true);

        const hint = Ping.pingHint(ping);

        const response: string[] = [
            `Running Version: ${bot.version}`,
            `Uptime: ${uptime}`,
            `Latency: ${ping}ms (${hint})`,
            `API Latency: ${apiLatency}ms`,
        ];

        await interaction.reply({ content: response.join('\n'), ephemeral });
    }
}

export default new Ping();
