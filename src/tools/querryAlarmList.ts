import { z } from 'zod'

export const querryAlarmToolDefinition = {
    name: "queryAlarmList",
    parameters: z.object({}),
    description: "Query the alarm list"
}

type Args = z.infer<typeof querryAlarmToolDefinition.parameters>

interface ToolFn<A = any, T = any> {
    (input: { userMessage: string; toolArgs: A }): Promise<T>
}

export const querryAlarmList: ToolFn<Args, string> = async () => {
    const res = ["Alarm 1", "Alarm 2"]
    return res.join(", ")
}