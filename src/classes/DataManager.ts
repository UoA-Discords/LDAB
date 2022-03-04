import fs from 'fs';

/** DataManager manages data thats stored and retrieved from a file. */
export default class DataManager {
    private _fileName: string;
    private _encoding: BufferEncoding;

    /** @param {string} fileName Path to file from root directory, e.g. `data/users/NachoToast.json` */
    public constructor(fileName: string, initialContent: string, encoding: BufferEncoding = 'utf-8') {
        this._fileName = fileName;
        this._encoding = encoding;

        // make the file and parent folders if non-existent
        if (!fs.existsSync(fileName)) {
            const folders = fileName.split('/');
            let currentNavigation = '';
            for (const folder of folders) {
                currentNavigation += `${folder}/`;
                if (fs.existsSync(currentNavigation)) continue;
                if (folder.includes('.')) {
                    fs.writeFileSync(fileName, initialContent, encoding);
                    break;
                } else {
                    fs.mkdirSync(currentNavigation);
                }
            }
        }
    }

    public get data(): string {
        return fs.readFileSync(this._fileName, this._encoding);
    }

    public set data(data: string) {
        fs.writeFileSync(this._fileName, data, this._encoding);
    }
}
