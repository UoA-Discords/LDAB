import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { Bot } from '../classes/Bot';

export interface CommandParams {
    interaction: CommandInteraction;
    bot: Bot;
}

export abstract class Command {
    public abstract name: string;
    public abstract description: string;

    public abstract build(bot: Bot): SlashCommandBuilder;
    public abstract execute({ interaction, bot }: CommandParams): Promise<void> | void;
}
