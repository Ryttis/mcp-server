import { transcribeLogic } from "./transcribe.logic.js";
import { transcribeIO } from "./transcribe.io.js";

export default async function transcribe(params = {}) {
    return transcribeLogic(params, transcribeIO);
}
