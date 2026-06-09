

export const normalizeItem = <T extends Record<string, any>>(doc: T) => {
    if(!doc) return doc;
    const {_id,__v,...rest} = doc;
    return {
        id: _id.toString(),
        ...rest
    }
} 

export const normalizeList = <T extends Record<string, any>>(docs: T[]) => {
    return docs.map(normalizeItem)
}