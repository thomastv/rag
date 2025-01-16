import OpenAI from "openai"
import { querryAlarmList, querryAlarmToolDefinition } from "./querryAlarmList"

export const runTool = async (
    toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
    userMessage: string
)  => {
    const input = {
        userMessage,
        toolArgs: JSON.parse(toolCall.function.arguments || '{}'),
    }

    switch(toolCall.function.name){
        case querryAlarmToolDefinition.name:
            return querryAlarmList(input)

            default:
                return `Please do not call this tool again: ${toolCall.function.name}`
    }

}