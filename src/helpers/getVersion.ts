import { readFileSync } from 'fs';
import { join } from 'path';

/** Gets the version of the bot, first checking `process.env` and falling back to reading `package.json`. */
function getVersion(): string {
    try {
        const easyVersion = process.env.npm_package_version;
        if (easyVersion) return easyVersion;
        const packageJson = JSON.parse(readFileSync(join(__dirname, '../', '../', 'package.json'), 'utf-8'));
        return packageJson?.version ?? 'Unknown';
    } catch (error) {
        console.log(error);
        return 'Unknown (Errored)';
    }
}

export default getVersion;
