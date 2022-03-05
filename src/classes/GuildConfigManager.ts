import { Snowflake } from 'discord.js';
import GuildConfig from '../types/GuildConfig';
import DataManager from './DataManager';

export default class GuildConfigManager {
    private _guildData: Record<Snowflake, GuildConfig>;
    private _guildConfigDataManager: DataManager;

    public constructor() {
        this._guildConfigDataManager = new DataManager(
            'data/guildConfig/guilds.json',
            JSON.stringify({}, undefined, 4),
        );

        this._guildData = JSON.parse(this._guildConfigDataManager.data);
    }

    private save() {
        this._guildConfigDataManager.data = JSON.stringify(this._guildData, undefined, 4);
    }

    public getGuildConfig(id: Snowflake): GuildConfig {
        return this._guildData[id] || {};
    }

    public updateGuildConfig(id: Snowflake, newConfig: GuildConfig): void {
        this._guildData[id] = newConfig;
        this.save();
    }

    public clearGuildConfig(id: Snowflake): void {
        delete this._guildData[id];
        this.save();
    }

    public get data(): Record<Snowflake, GuildConfig> {
        return this._guildData;
    }
}
