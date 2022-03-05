import { SlashCommandBuilder, userMention } from '@discordjs/builders';
import { Guild, GuildMember, MessageEmbed, Snowflake } from 'discord.js';
import moment from 'moment';
import { Bot } from '../classes/Bot';
import { Entry } from '../classes/SheetManager';
import { Command, CommandParams } from '../types/Command';

export interface GuildMemberEntry extends GuildMember {
    entry: Entry;
}

export class Scan implements Command {
    public name = 'scan';
    public description = 'Check all users.';
    public build(): SlashCommandBuilder {
        return new SlashCommandBuilder().setName(this.name).setDescription(this.description);
    }

    public async execute({ interaction, bot }: CommandParams): Promise<void> {
        if (!interaction.guild) {
            return await interaction.reply({
                content: 'You need to be in a server to use this command',
                ephemeral: true,
            });
        }
        await interaction.deferReply();

        const bannedMembers = await Scan.scanGuild(interaction.guild, bot);
        if (!bannedMembers.length) {
            await interaction.editReply({ content: '✅ No blacklisted users found in the server' });
            return;
        }

        const response: string[] = bannedMembers.map(
            (e, i) => `${i + 1}. ${userMention(e.id)} (${moment(e.entry.timestamp).fromNow()}. ${e.entry.reason})`,
        );
        const embed = new MessageEmbed()
            .setTitle(
                `${bannedMembers.length} Blacklisted user${bannedMembers.length !== 1 ? 's' : ''} found in the server:`,
            )
            .setDescription(response.join('\n'));

        try {
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({ content: error instanceof Error ? error.message : `${error}` });
        }
    }

    /** Scans the members in a guild to see if any are in the global banlist.
     *
     * @returns {Promise<GuildMemberEntry[]>} Set of user IDs that are in the global banlist and also in the server.
     */
    public static async scanGuild(guild: Guild, bot: Bot): Promise<GuildMemberEntry[]> {
        const output: GuildMemberEntry[] = [];

        const bannedIds = new Set<Snowflake>(Object.keys(bot.sheetManager.entries));

        const allMembers = await guild.members.fetch();

        for (const [id, member] of allMembers) {
            const full: GuildMemberEntry = member as GuildMemberEntry;
            full.entry = bot.sheetManager.entries[id];
            if (bannedIds.has(id)) output.push(full);
        }

        return output;
    }
}

export default new Scan();
