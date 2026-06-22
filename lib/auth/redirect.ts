const DEFAULT_NEXT_PATH = "/app";

export function safeNextPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return DEFAULT_NEXT_PATH;
  }

  if (!nextPath.startsWith("/")) {
    return DEFAULT_NEXT_PATH;
  }

  if (nextPath.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return nextPath;
}
