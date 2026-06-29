export async function register() {
  if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "nodejs") {
    const httpsModule = await import("https");
    const httpModule = await import("http");

    globalThis.fetch = async function nodeFetch(
      input: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof Request
          ? input.url
          : input.toString()
      );
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? httpsModule : httpModule;

      const initHeaders: Record<string, string> = {};
      const srcHeaders = input instanceof Request ? input.headers : init?.headers;
      if (srcHeaders instanceof Headers) {
        srcHeaders.forEach((v, k) => { initHeaders[k] = v; });
      } else if (srcHeaders) {
        Object.assign(initHeaders, srcHeaders as Record<string, string>);
      }

      let bodyText: string | undefined;
      const rawBody = input instanceof Request ? await input.text() : init?.body;
      if (rawBody != null) {
        if (typeof rawBody === "string") bodyText = rawBody;
        else if (rawBody instanceof Uint8Array) bodyText = Buffer.from(rawBody).toString();
        else bodyText = String(rawBody);
      }
      if (bodyText) {
        const hasContentType = Object.keys(initHeaders).some(
          (k) => k.toLowerCase() === "content-type"
        );
        if (!hasContentType && bodyText.trimStart().startsWith("{")) {
          initHeaders["content-type"] = "application/json";
        }
        initHeaders["content-length"] = Buffer.byteLength(bodyText).toString();
      }

      const method = (
        (input instanceof Request ? input.method : init?.method) ?? "GET"
      ).toUpperCase();

      return new Promise((resolve, reject) => {
        const options = {
          hostname: url.hostname,
          port: url.port ? parseInt(url.port) : isHttps ? 443 : 80,
          path: url.pathname + url.search,
          method,
          headers: initHeaders,
          family: 4,
        };

        const req = (lib.request as typeof httpsModule.request)(options, (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => {
            const body = Buffer.concat(chunks);
            const responseHeaders = new Headers();
            Object.entries(res.headers).forEach(([k, v]) => {
              if (v != null) responseHeaders.set(k, Array.isArray(v) ? v.join(", ") : v);
            });
            const status = res.statusCode ?? 200;
            const nullBody = [101, 103, 204, 205, 304].includes(status);
            resolve(
              new Response(nullBody ? null : body, {
                status,
                statusText: res.statusMessage ?? "",
                headers: responseHeaders,
              })
            );
          });
        });

        req.on("error", (e: Error) => reject(e));
        req.setTimeout(120000, () => {
          req.destroy(new Error("Request timed out after 120s"));
        });

        if (bodyText) req.write(bodyText);
        req.end();
      });
    } as typeof fetch;
  }
}
