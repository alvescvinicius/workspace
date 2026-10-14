import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import tz from 'dayjs/plugin/timezone.js';
import { JsonUtils } from "@brcap/utils";

let initialized = false;
if (!initialized) {
    initialized = true;

    JsonUtils.patchBigInt();
    dayjs.extend(customParseFormat);
    dayjs.extend(utc);
    dayjs.extend(tz);
    dayjs.locale("pt-br");
}
