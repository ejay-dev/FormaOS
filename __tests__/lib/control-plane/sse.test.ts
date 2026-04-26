/**
 * @jest-environment node
 */

import { createSafeSseWriter } from '@/lib/control-plane/sse';

describe('createSafeSseWriter', () => {
  it('ignores duplicate closes from abort/cancel races', () => {
    const onClose = jest.fn();
    const controller = {
      close: jest.fn(),
      enqueue: jest.fn(),
    } as unknown as ReadableStreamDefaultController<Uint8Array>;

    const writer = createSafeSseWriter(controller, onClose);

    writer.close();
    writer.close();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(controller.close).toHaveBeenCalledTimes(1);
    expect(writer.isClosed()).toBe(true);
  });

  it('marks closed when enqueue hits an already-closed stream', () => {
    const onClose = jest.fn();
    const controller = {
      close: jest.fn(() => {
        throw new TypeError('Controller is already closed');
      }),
      enqueue: jest.fn(() => {
        throw new TypeError('Controller is already closed');
      }),
    } as unknown as ReadableStreamDefaultController<Uint8Array>;

    const writer = createSafeSseWriter(controller, onClose);
    const accepted = writer.enqueue(new Uint8Array([1]));

    expect(accepted).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(controller.close).toHaveBeenCalledTimes(1);
    expect(writer.isClosed()).toBe(true);
  });
});
