export function createSafeSseWriter(
  controller: ReadableStreamDefaultController<Uint8Array>,
  onClose: () => void,
) {
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    onClose();
    try {
      controller.close();
    } catch {
      // The browser or runtime may already have closed the stream.
    }
  };

  const enqueue = (chunk: Uint8Array) => {
    if (closed) return false;
    try {
      controller.enqueue(chunk);
      return true;
    } catch {
      close();
      return false;
    }
  };

  return {
    close,
    enqueue,
    isClosed: () => closed,
  };
}
