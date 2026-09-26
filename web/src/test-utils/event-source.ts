/**
 * A stand-in for EventSource, which jsdom lacks. The test setup installs it;
 * tests drive the latest instance with `emit` and `fail`.
 */
export class FakeEventSource {
  static instances: FakeEventSource[] = [];

  static latest(): FakeEventSource {
    const source = FakeEventSource.instances.at(-1);
    if (!source) throw new Error('no EventSource was opened');
    return source;
  }

  readonly url: string;
  closed = false;
  private readonly target = new EventTarget();

  constructor(url: string | URL) {
    this.url = String(url);
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions): void {
    this.target.addEventListener(type, listener, options);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.target.removeEventListener(type, listener);
  }

  close(): void {
    this.closed = true;
  }

  /** Delivers a named event as the server would send it. */
  emit(event: string, data: unknown): void {
    this.target.dispatchEvent(
      new MessageEvent(event, { data: typeof data === 'string' ? data : JSON.stringify(data) })
    );
  }

  /** Drops the connection. */
  fail(): void {
    this.target.dispatchEvent(new Event('error'));
  }
}
