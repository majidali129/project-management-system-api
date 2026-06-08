export const TASK_CACHE_TTL = {
    admin: 3000,
    user: 5000,
    details: 5000,

}
export const TASK_CACHE_KEYS = {
    allAdmin: 'tasks:all:admin',
    allByUser: (userId: string) => `tasks:all:user:${userId}`,
    details: (taskId: string) => `tasks:${taskId}`
}