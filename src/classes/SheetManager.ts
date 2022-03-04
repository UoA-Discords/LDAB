import { TypedEmitter } from 'tiny-typed-emitter';
import { request, RequestOptions } from 'https';
import { config } from '../config';
import { Snowflake } from 'discord.js';
import Banlist from '../types/BanList';
import Logger from './Logger';
import DataManager from './DataManager';

export interface SheetManagerEvents {
    userAdded: (info: Entry) => void;
    userRemoved: (info: Entry) => void;
}

export interface Entry {
    timestamp: number;
    username: string;
    id: Snowflake;
    reason?: string;
}

/** Checks google sheet at regular intervals, and updates members accordingly.
 *
 * Emits data when members are removed or added, see {@link SheetManagerEvents}, note this
 * isn't dependent on the timestamp on the sheet.
 *
 * Don't have > 1 of these active at any given time, or else they will be simultaneously
 * writing to the same file (if the sheet IDs are the same).
 */
export class SheetManager extends TypedEmitter<SheetManagerEvents> {
    private readonly _reqOptions: RequestOptions;
    private readonly _logger: Logger;
    private readonly _dataManager: DataManager;

    public readonly entries: { [discordId: Snowflake]: Entry };
    public lastUpdated = 0;

    public constructor(apiKey: string, sheetId: string, logger: Logger) {
        super();
        this._reqOptions = {
            hostname: 'sheets.googleapis.com',
            port: 443,
            path: `/v4/spreadsheets/${sheetId}/values/A:D?key=${apiKey}`,
        };
        this._logger = logger;
        this._dataManager = new DataManager(`data/${sheetId}.json`, JSON.stringify({}, undefined, 4));
        this.entries = JSON.parse(this._dataManager.data);

        setInterval(() => this._main(), config.checkInterval * 1000);
    }

    public save(): void {
        this._dataManager.data = JSON.stringify(this.entries, undefined, 4);
    }

    private async _main(): Promise<void> {
        const latestList = await this._makeGetRequest();
        if (!latestList) return;
        this.lastUpdated = Date.now();

        const deletedIds = new Set<Snowflake>(Object.keys(this.entries));

        let mutated = false;

        // slice at 1 to exclude the header row
        for (const rawEntry of latestList.values.slice(1)) {
            const id = rawEntry[2];
            if (this.entries[id]) {
                deletedIds.delete(id);
                continue;
            }

            mutated = true;
            const newEntry: Entry = {
                timestamp: new Date(rawEntry[0]).getTime(),
                username: rawEntry[1],
                id,
                reason: rawEntry[3],
            };

            this.emit('userAdded', newEntry);

            this.entries[id] = newEntry;
        }

        // at this point all existing ids should've been removed from
        // the deletedIds set.
        for (const id of deletedIds) {
            const relevantEntry = this.entries[id];
            if (!relevantEntry) {
                this._logger.log(
                    `Error: ${id} was in deletedIds set but doesn't have a corresponding entry, this should never happen`,
                );
                continue;
            }

            mutated = true;
            this.emit('userRemoved', relevantEntry);
            delete this.entries[id];
        }

        if (mutated) this.save();
    }

    private _makeGetRequest(): Promise<Banlist | null> {
        return new Promise((resolve) => {
            const req = request(this._reqOptions, (res) => {
                let response = '';

                res.on('data', (d) => (response += d));

                res.on('close', () => {
                    try {
                        resolve(JSON.parse(response) as Banlist);
                    } catch (error) {
                        this._logger.log('Banlist was invalid shape');
                        this._logger.log(error);
                        resolve(null);
                    }
                });
            });

            req.on('error', (error) => {
                this._logger.log('Error getting banlist');
                this._logger.log(error);
                resolve(null);
            });

            req.end();
        });
    }
}
