import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const baseDir = join(__dirname, '../../');

if (!existsSync(`${baseDir}/logs`)) {
    mkdirSync(`${baseDir}/logs`);
}

class Logger {
    private _filePath: string;

    public constructor(name: string, version: string) {
        this._filePath = `${baseDir}/logs/${name}.log`;

        if (!existsSync(this._filePath)) {
            writeFileSync(this._filePath, '', 'utf-8');
            this.log(`*** New Instance Started [${version}] ***`);
        }
    }

    public log(content: unknown): void {
        const msg = `[${new Date().toLocaleTimeString()}] ${content}\n`;

        appendFileSync(this._filePath, msg, 'utf-8');
    }
}

export default Logger;
