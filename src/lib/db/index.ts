export const isLocal = () => process.env.USE_LOCAL_DB === 'true'

export async function getLocalOrRemote<T>(
  localFn: () => T,
  remoteFn: () => Promise<T>
): Promise<T> {
  if (isLocal()) {
    return Promise.resolve(localFn())
  }
  return remoteFn()
}
