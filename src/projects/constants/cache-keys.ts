export const PROJECT_CACHE_TTL = {
    admin: 3000,
    user: 5000,
    details: 5000,
    members: 5000
}
export const PROJECT_CACHE_KEYS = {
    allAdmin: 'projects:all:admin',
    allByUser: (userId: string) => `projects:all:user:${userId}`,
    details: (projectId:string) => `projects:${projectId}`,
    members: (projectId: string) => `projects:${projectId}:members`
}