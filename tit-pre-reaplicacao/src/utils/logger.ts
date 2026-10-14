import { createLogger } from '@brcap/log';
import util from 'util';

export const { getLogger, createRequestContext } = createLogger();

type Color = {
    fg: number;
    bg: number;
}

const colours: { [s: string]: Color; } = {
    'default': {
        fg: 0,
        bg: 0
    },
    'black': {
        fg: 30,
        bg: 40
    },
    'red': {
        fg: 31,
        bg: 41
    },
    'green': {
        fg: 32,
        bg: 42
    },
    'yellow': {
        fg: 33,
        bg: 43
    },
    'blue': {
        fg: 34,
        bg: 44
    },
    'magenta': {
        fg: 35,
        bg: 45
    },
    'cyan': {
        fg: 36,
        bg: 46
    },
    'white': {
        fg: 37,
        bg: 47
    }
}

function setColour(colour: Color): string {
    return `\x1b[${colour.fg}m`;
}

function makeSpaces(spaces?: number) {
    if (!spaces)
        return ``;

    let result = ``;
    while (spaces > 0) {
        result += ` `;
        spaces--;
    }
    return result;
}

function tokeniseMarkdown(s: string, asniFormat: boolean) {
    return s
        .replace(/\*\*(.+?)\*\*(?!\*)/g, asniFormat ? '\x1b[1m$1\x1b[0m' : '$1')
        .replace(/\*([^*><]+)\*/g, asniFormat ? '\x1b[3m$1\x1b[0m' : '$1');
}

export function formatMessage(log: Array<any>, asniFormat: boolean, spaces?: number): string {
    let msg = ``;

    for (let i = 0; i < log.length; i++) {
        const data = log[i];

        if (i > 0)
            msg += ` `;

        if (typeof data === 'string') {
            msg += makeSpaces(spaces);
            msg += tokeniseMarkdown(data, asniFormat);
            continue;
        }

        if (typeof data === 'number' || typeof data === 'bigint' || typeof data === 'boolean') {
            if (asniFormat)
                msg += setColour(colours['yellow']);

            msg += makeSpaces(spaces);
            msg += data.toString();

            if (asniFormat)
                msg += setColour(colours['default']);

            continue;
        }

        if (typeof data === 'symbol' || typeof data === 'undefined' || data === null) {
            if (asniFormat)
                msg += setColour(colours['blue'])

            msg += makeSpaces(spaces);
            msg += String(data);

            if (asniFormat)
                msg += setColour(colours['default']);

            continue;
        }

        if (typeof data === 'object' && usedSymbol in data) {
            if (data[usedSymbol])
                continue;
            else
                data[usedSymbol] = true;
        }

        msg += makeSpaces(spaces);
        msg += util.inspect(data, false, 20, asniFormat).replaceAll(`\n`, '\n' + makeSpaces(spaces));
    }

    return msg;
}

export const usedSymbol = Symbol(`Used`);
